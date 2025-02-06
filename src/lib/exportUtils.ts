import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';

export const exportSVG = async (mapContainer: Element | null) => {
  if (!mapContainer) {
    throw new Error('Map container not found');
  }

  const svg = mapContainer.querySelector('svg');
  if (!svg) {
    throw new Error('SVG element not found');
  }

  // Create a deep clone of the SVG
  const svgClone = svg.cloneNode(true) as SVGElement;
  
  // Preserve the namespace
  svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  
  // Preserve dimensions
  svgClone.setAttribute('width', svg.getAttribute('width') || '960');
  svgClone.setAttribute('height', svg.getAttribute('height') || '600');
  svgClone.setAttribute('viewBox', svg.getAttribute('viewBox') || '0 0 960 600');
  
  // Preserve all styles by copying them directly
  const allElements = Array.from(svg.getElementsByTagName('*'));
  const allClonedElements = Array.from(svgClone.getElementsByTagName('*'));
  
  allElements.forEach((el, index) => {
    const computedStyle = window.getComputedStyle(el);
    const clonedEl = allClonedElements[index];
    
    const importantStyles = [
      'fill',
      'stroke',
      'stroke-width',
      'opacity',
      'transform'
    ];
    
    importantStyles.forEach(style => {
      const value = computedStyle.getPropertyValue(style);
      if (value) {
        clonedEl.setAttribute(style, value);
      }
    });
  });

  // Serialize to string
  const serializer = new XMLSerializer();
  const svgContent = serializer.serializeToString(svgClone);
  
  // Verify size
  const svgSize = new Blob([svgContent]).size;
  console.log('SVG size:', svgSize, 'bytes');
  
  if (svgSize < 1024) {
    throw new Error(`Generated SVG is too small (${svgSize} bytes). Please try again.`);
  }
  
  // Create and save blob
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  saveAs(blob, 'world-sales-map.svg');
};

export const exportPDF = async (mapContainer: Element | null) => {
  if (!mapContainer) {
    throw new Error('Map container not found');
  }

  const element = mapContainer.cloneNode(true) as HTMLElement;
  
  const opt = {
    margin: 1,
    filename: 'world-sales-map.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
  };
  
  await html2pdf().set(opt).from(element).save();
};