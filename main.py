import modal
import torchaudio.transforms as T
import torch.nn as nn
import torch
from model import AudioClassifier
from pydantic import BaseModel
import base64
import numpy as np
import soundfile as sf
import io
import librosa
import requests

app = modal.App(name="Audio-Classification-Inference")

image = modal.Image.debian_slim().pip_install_from_requirements('requirements.txt').apt_install("libsndfile1").add_local_python_source("model")

model_volume = modal.Volume.from_name("model-volume")

class EvaluateRequest(BaseModel):
    audio_data: str

class AudioProcessor:
    def __init__(self):
        self.transform = nn.Sequential(
            T.MelSpectrogram(
                sample_rate=44100,
                n_fft=2048,
                hop_length=512,
                n_mels=128,
                f_min=0,
                f_max=22050
            ),
            T.AmplitudeToDB()
        )
    def process_audio(self,audio_data):
        waveform= torch.from_numpy(audio_data).float()
        waveform = waveform.unsqueeze(0)
        spectrogram = self.transform(waveform)
        return spectrogram.unsqueeze(0)

@app.cls(image=image, gpu="A10G", volumes={"/models": model_volume}, scaledown_window=10)
class Main:
    @modal.enter()
    def load_model(self):
        print("Loading model...")
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        try:
            checkpoint = torch.load("/models/best_model.pth", map_location=self.device)
            print(f"Checkpoint keys: {list(checkpoint.keys())}")
            print(f"Model classes: {checkpoint['classes']}")
            
            self.classes = checkpoint["classes"]
            self.model = AudioClassifier(num_classes=len(self.classes))
            
            # Print model state dict keys for debugging
            model_keys = set(self.model.state_dict().keys())
            checkpoint_keys = set(checkpoint["model_state_dict"].keys())
            print(f"Model keys count: {len(model_keys)}")
            print(f"Checkpoint keys count: {len(checkpoint_keys)}")
            
            missing_keys = model_keys - checkpoint_keys
            extra_keys = checkpoint_keys - model_keys
            
            if missing_keys:
                print(f"Missing keys in checkpoint: {missing_keys}")
            if extra_keys:
                print(f"Extra keys in checkpoint: {extra_keys}")
            
            # Try loading with strict=False first, then strict=True if that fails
            try:
                self.model.load_state_dict(checkpoint["model_state_dict"], strict=True)
                print("Model loaded with strict=True")
            except RuntimeError as e:
                print(f"Strict loading failed: {e}")
                print("Attempting to load with strict=False...")
                result = self.model.load_state_dict(checkpoint["model_state_dict"], strict=False)
                print(f"Partial loading result: {result}")
                if result.missing_keys:
                    print(f"Still missing keys: {result.missing_keys}")
                if result.unexpected_keys:
                    print(f"Unexpected keys: {result.unexpected_keys}")
            
            self.model.to(self.device)
            self.model.eval()
            
            self.processor = AudioProcessor()
            print("Model loaded successfully")
            
        except Exception as e:
            print(f"Error loading model: {e}")
            raise

    @modal.fastapi_endpoint(method="POST")
    def evaluate(self,request:EvaluateRequest):
        # here upload to s3 then download from there but for now simply pass the file in the netwrok request

        audio_bytes = base64.b64decode(request.audio_data)
        audio_data, sample_rate = sf.read(io.BytesIO(audio_bytes), dtype="float32")

        if audio_data.ndim >1:
            audio_data = np.mean(audio_data,axis=1)

        if sample_rate != 44100:
            audio_data = librosa.resample(audio_data,orig_sr=sample_rate,target_sr=44100)

        spectrogram = self.processor.process_audio(audio_data)
        spectrogram = spectrogram.to(self.device)

        with torch.no_grad():
            output, feature_maps = self.model(spectrogram, return_feature_maps=True)
            output = torch.nan_to_num(output)

            probabilities = torch.softmax(output,dim=1) # dim = 0 is batch and dim = 1 is classes

            top3_probs, top3_indices = torch.topk(probabilities,k=3)

            predictions = [{"class": self.classes[idx.item()], "confidence": prob.item()} for prob,idx in zip(top3_probs[0],top3_indices[0])]

            visualizations = {}
            for name, tensor in feature_maps.items():
                if tensor.dim == 4: #batch_size,channels,height,width
                    aggregate_tensor = torch.mean(tensor,dim=1)
                    squeezed_tensor = aggregate_tensor.squeeze(0)
                    numpy_array = squeezed_tensor.cpu().numpy()
                    clean_array = np.nan_to_num(numpy_array)
                    visualizations[name] = {
                        "shape": list(clean_array.shape),
                        "values": clean_array.tolist()
                    }
            # batch_size,channels,height,width
            spectogram_np = spectrogram.squeeze(0).squeeze(0).cpu().numpy()
            clean_spectogram = np.nan_to_num(spectogram_np)

            max_samples = 8000
            if len(audio_data) > max_samples:
                step = len(audio_data) // max_samples
                waveform_data = audio_data[::step]
            else:
                waveform_data = audio_data
            return {"predictions":predictions, "visualization":visualizations, "input_spectogram":{
                "shape": list(clean_spectogram.shape),
                "values": clean_spectogram.tolist()
            }, "waveform": {
                "values": waveform_data.tolist(),
                "sample_rate": sample_rate,
                "duration": len(audio_data) / sample_rate
            }}


@app.local_entrypoint()
def main():
    audio_data, sample_rate = sf.read("1-103995-A-30.wav")
    buffer = io.BytesIO()
    sf.write(buffer,audio_data,sample_rate,format="WAV")
    audio_b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    payload = {"audio_data":audio_b64}
    server = Main()
    url = server.evaluate.get_web_url()

    response = requests.post(url,json=payload)
    response.raise_for_status()


    result = response.json()

    waveform_info = result.get("waveform",{})
    if waveform_info:
        values = waveform_info.get("values",[])
        print(f"first 10 values of waveform: {[round(v,4) for v in values[:10]]}...")
        print(f"sample rate: {waveform_info.get('sample_rate',0)}")
        print(f"duration: {waveform_info.get('duration',0)} seconds")


    print("Top 3 predictions:")
    for prediction in result.get("predictions",[]):
        print(f"{prediction['class']}: {prediction['confidence']:0.2%}")






        

