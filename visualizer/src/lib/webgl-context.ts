class WebGLContextManager {
  private activeCanvas: string | null = null;
  private contexts: Map<string, boolean> = new Map<string, boolean>();
  private priorities: Map<string, number> = new Map<string, number>();
  private callbacks: Map<string, (active: boolean) => void> = new Map<string, (active: boolean) => void>();

  register(id: string, priority= 0): boolean {

    this.priorities.set(id, priority);
    
    // Allow higher priority canvases to override lower priority ones
    if (this.activeCanvas && this.activeCanvas !== id) {
      const currentPriority = this.priorities.get(this.activeCanvas) ?? 0;
      if (priority <= currentPriority) {
        console.warn(`WebGL Context: Canvas ${id} blocked, ${this.activeCanvas} is active (priority: ${currentPriority} vs ${priority})`);
        return false;
      } else {
        console.log(`WebGL Context: Canvas ${id} overriding ${this.activeCanvas} (priority: ${priority} vs ${currentPriority})`);
      }
    }
    
    this.activeCanvas = id;
    this.contexts.set(id, true);
    console.log(`WebGL Context: ${id} registered as active`);
    return true;
  }

  unregister(id: string): void {
    if (this.activeCanvas === id) {
      this.activeCanvas = null;
      
      // Try to restore the highest priority remaining canvas
      let highestPriority = -1;
      let candidateCanvas: string | null = null;
      
      for (const [canvasId, isActive] of this.contexts) {
        if (canvasId !== id && isActive) {
          const priority = this.priorities.get(canvasId) ?? 0;
          if (priority > highestPriority) {
            highestPriority = priority;
            candidateCanvas = canvasId;
          }
        }
      }
      
      if (candidateCanvas) {
        this.activeCanvas = candidateCanvas;
        console.log(`WebGL Context: Restored ${candidateCanvas} as active (priority: ${highestPriority})`);
        // Trigger a custom event to notify components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('webgl-context-restored', { 
            detail: { canvasId: candidateCanvas } 
          }));
        }
      }
    }
    
    this.contexts.delete(id);
    this.priorities.delete(id);
    console.log(`WebGL Context: ${id} unregistered`);
  }

  isActive(id: string): boolean {
    return this.activeCanvas === id;
  }

  getActiveCanvas(): string | null {
    return this.activeCanvas;
  }
}

export const webglManager = new WebGLContextManager();
