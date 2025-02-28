// src/utils/zoomUtils.ts
export const applyZoom = (element: HTMLElement, zoom: number) => {
    try {
      element.style.transform = `scale(${zoom / 100})`;
      element.style.transformOrigin = 'top left';
      
      const parentContainer = element.parentElement;
      if (parentContainer) {
        parentContainer.style.overflow = 'auto';
        parentContainer.style.width = '100%';
        parentContainer.style.height = 'calc(100vh - 100px)';
      }
      
      return true;
    } catch (error) {
      console.error('Zoom application error:', error);
      return false;
    }
  };