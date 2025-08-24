import modal

app = modal.App("example-get-started")

image = modal.Image.debian_slim().pip_install_from_requirements("requirements.txt").apt_install("ffmpeg", "libsndfile1","wget", "unzip").add_local_python_source("model").run_commands("cd /tmp && wget https://github.com/karolpiczak/ESC-50/archive/master.zip -O ESC-50.zip", "cd /tmp && unzip ESC-50.zip", "mkdir -p /opt/ESC-50", "cp -r /tmp/ESC-50-master/* /opt/ESC-50/", "rm -rf /tmp/ESC-50.zip /tmp/ESC-50-master")

volume = modal.Volume.from_name("ESC-50", create_if_missing=True)
model_volume = modal.Volume.from_name("model-volume", create_if_missing=True)




@app.function()
def square(x):
    print("This code is running on a remote worker!")
    return x**2


@app.local_entrypoint()
def main():
    print("the square is", square.remote(42))
