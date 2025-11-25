import jsPDF from 'jspdf';
import { Source, BeatSheet, OutlineNode, Note } from '../types';

// Screenplay formatting constants (industry standard)
const PAGE_WIDTH = 8.5; // inches
const PAGE_HEIGHT = 11; // inches
const LEFT_MARGIN = 1.5; // inches
const RIGHT_MARGIN = 1; // inches
const TOP_MARGIN = 1; // inches
const BOTTOM_MARGIN = 1; // inches

// Element margins (from left edge in inches)
const ELEMENT_MARGINS = {
  sceneHeading: 1.5,
  action: 1.5,
  character: 3.7,
  parenthetical: 3.1,
  dialogue: 2.5,
  transition: 6,
};

// Element widths (in inches)
const ELEMENT_WIDTHS = {
  sceneHeading: 6,
  action: 6,
  character: 3.3,
  parenthetical: 2.5,
  dialogue: 3.5,
  transition: 1.5,
};

export interface ExportOptions {
  title?: string;
  author?: string;
  includeTitlePage?: boolean;
}

// Parse screenplay content into elements
interface ScriptElement {
  type: 'sceneHeading' | 'action' | 'character' | 'parenthetical' | 'dialogue' | 'transition' | 'empty';
  content: string;
}

function parseScreenplay(content: string): ScriptElement[] {
  const lines = content.split('\n');
  const elements: ScriptElement[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = (lines[i] || '').trim();
    
    if (!line) {
      elements.push({ type: 'empty', content: '' });
      i++;
      continue;
    }
    
    // Scene heading (INT./EXT.)
    if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/.test(line.toUpperCase())) {
      elements.push({ type: 'sceneHeading', content: line.toUpperCase() });
      i++;
      continue;
    }
    
    // Transition (CUT TO:, FADE OUT, etc.)
    if (/^(CUT TO:|FADE OUT|FADE IN:|DISSOLVE TO:|SMASH CUT:|TIME CUT:|MATCH CUT:)/.test(line.toUpperCase()) ||
        line.toUpperCase().endsWith(':') && line === line.toUpperCase() && line.length < 20) {
      elements.push({ type: 'transition', content: line.toUpperCase() });
      i++;
      continue;
    }
    
    // Character name (all caps, centered-ish, followed by dialogue)
    if (line === line.toUpperCase() && 
        line.length < 40 && 
        !line.includes('.') &&
        i + 1 < lines.length) {
      const nextLine = lines[i + 1]?.trim();
      // Check if next line is dialogue or parenthetical
      if (nextLine && (nextLine.startsWith('(') || !nextLine.match(/^(INT\.|EXT\.)/i))) {
        elements.push({ type: 'character', content: line });
        i++;
        
        // Check for parenthetical
        while (i < lines.length) {
          const currentLine = (lines[i] || '').trim();
          if (!currentLine) break;
          
          if (currentLine.startsWith('(') && currentLine.endsWith(')')) {
            elements.push({ type: 'parenthetical', content: currentLine });
          } else if (currentLine === currentLine.toUpperCase() && currentLine.length < 40 && !currentLine.includes('.')) {
            // New character
            break;
          } else if (/^(INT\.|EXT\.)/.test(currentLine.toUpperCase())) {
            break;
          } else {
            elements.push({ type: 'dialogue', content: currentLine });
          }
          i++;
        }
        continue;
      }
    }
    
    // Default to action
    elements.push({ type: 'action', content: line });
    i++;
  }
  
  return elements;
}

// Export screenplay to PDF
export function exportToPDF(
  scriptContent: string,
  options: ExportOptions = {}
): void {
  const { title = 'Untitled Screenplay', author = '', includeTitlePage = true } = options;
  
  const pdf = new jsPDF({
    unit: 'in',
    format: 'letter',
  });
  
  // Set Courier font (industry standard)
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(12);
  
  let currentY = TOP_MARGIN;
  let pageNumber = 1;
  
  const addPage = () => {
    pdf.addPage();
    pageNumber++;
    currentY = TOP_MARGIN;
    
    // Add page number (top right)
    pdf.setFontSize(10);
    pdf.text(`${pageNumber}.`, PAGE_WIDTH - RIGHT_MARGIN, 0.5, { align: 'right' });
    pdf.setFontSize(12);
  };
  
  const getLineHeight = () => 0.167; // ~12pt line height
  
  const wrapText = (text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    const charWidth = 0.1; // Approximate Courier character width
    const maxChars = Math.floor(maxWidth / charWidth);
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxChars) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    return lines;
  };
  
  const writeElement = (element: ScriptElement) => {
    if (element.type === 'empty') {
      currentY += getLineHeight();
      return;
    }
    
    const margin = ELEMENT_MARGINS[element.type] || LEFT_MARGIN;
    const width = ELEMENT_WIDTHS[element.type] || 6;
    const lines = wrapText(element.content, width);
    
    for (const line of lines) {
      // Check if we need a new page
      if (currentY > PAGE_HEIGHT - BOTTOM_MARGIN) {
        addPage();
      }
      
      if (element.type === 'sceneHeading') {
        pdf.setFont('courier', 'bold');
      } else {
        pdf.setFont('courier', 'normal');
      }
      
      pdf.text(line, margin, currentY);
      currentY += getLineHeight();
    }
    
    // Add spacing after certain elements
    if (element.type === 'sceneHeading' || element.type === 'action') {
      currentY += getLineHeight() * 0.5;
    }
  };
  
  // Title page
  if (includeTitlePage) {
    pdf.setFontSize(24);
    pdf.setFont('courier', 'bold');
    pdf.text(title.toUpperCase(), PAGE_WIDTH / 2, 4, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.setFont('courier', 'normal');
    pdf.text('written by', PAGE_WIDTH / 2, 5, { align: 'center' });
    pdf.text(author || 'Anonymous', PAGE_WIDTH / 2, 5.5, { align: 'center' });
    
    addPage();
  }
  
  // Parse and write screenplay
  const elements = parseScreenplay(scriptContent);
  for (const element of elements) {
    writeElement(element);
  }
  
  // Download
  pdf.save(`${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
}

// Export to Fountain format
export function exportToFountain(scriptContent: string, title: string = 'Untitled'): void {
  // Fountain is essentially plain text with specific formatting
  // The script should already be in a close format, we just add metadata
  
  const fountain = `Title: ${title}
Credit: written by
Author: 
Draft date: ${new Date().toLocaleDateString()}
Contact: 

===

${scriptContent}
`;
  
  downloadFile(fountain, `${title.replace(/[^a-z0-9]/gi, '_')}.fountain`, 'text/plain');
}

// Export to Final Draft XML (FDX)
export function exportToFDX(scriptContent: string, title: string = 'Untitled'): void {
  const elements = parseScreenplay(scriptContent);
  
  const typeMap: Record<string, string> = {
    sceneHeading: 'Scene Heading',
    action: 'Action',
    character: 'Character',
    parenthetical: 'Parenthetical',
    dialogue: 'Dialogue',
    transition: 'Transition',
    empty: 'Action',
  };
  
  const paragraphs = elements
    .filter(e => e.content || e.type === 'empty')
    .map(e => {
      const escapedContent = e.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
      
      return `    <Paragraph Type="${typeMap[e.type] || 'Action'}">
      <Text>${escapedContent}</Text>
    </Paragraph>`;
    })
    .join('\n');
  
  const fdx = `<?xml version="1.0" encoding="UTF-8"?>
<FinalDraft DocumentType="Script" Template="No" Version="5">
  <Content>
${paragraphs}
  </Content>
  <TitlePage>
    <Content>
      <Paragraph Type="Title Page">
        <Text>${title}</Text>
      </Paragraph>
    </Content>
  </TitlePage>
</FinalDraft>
`;
  
  downloadFile(fdx, `${title.replace(/[^a-z0-9]/gi, '_')}.fdx`, 'application/xml');
}

// Export Story Bible as PDF
export function exportStoryBiblePDF(
  sources: Source[],
  beatSheet: BeatSheet,
  outline: OutlineNode[],
  notes: Note[],
  title: string = 'Story Bible'
): void {
  const pdf = new jsPDF({
    unit: 'in',
    format: 'letter',
  });
  
  let currentY = TOP_MARGIN;
  let pageNumber = 1;
  
  const addPage = () => {
    pdf.addPage();
    pageNumber++;
    currentY = TOP_MARGIN;
  };
  
  const checkPageBreak = (neededSpace: number = 1) => {
    if (currentY + neededSpace > PAGE_HEIGHT - BOTTOM_MARGIN) {
      addPage();
    }
  };
  
  const writeTitle = (text: string, size: number = 18) => {
    checkPageBreak(0.5);
    pdf.setFontSize(size);
    pdf.setFont('helvetica', 'bold');
    pdf.text(text, LEFT_MARGIN, currentY);
    currentY += size / 72 + 0.2;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
  };
  
  const writeSubtitle = (text: string) => {
    checkPageBreak(0.4);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(text, LEFT_MARGIN, currentY);
    currentY += 0.3;
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
  };
  
  const writeText = (text: string, indent: number = 0) => {
    const maxWidth = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN - indent;
    const lines = pdf.splitTextToSize(text, maxWidth);
    
    for (const line of lines) {
      checkPageBreak(0.2);
      pdf.text(line, LEFT_MARGIN + indent, currentY);
      currentY += 0.18;
    }
    currentY += 0.1;
  };
  
  // Title page
  pdf.setFontSize(36);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, PAGE_WIDTH / 2, 4, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Story Bible', PAGE_WIDTH / 2, 4.6, { align: 'center' });
  pdf.text(new Date().toLocaleDateString(), PAGE_WIDTH / 2, 5, { align: 'center' });
  
  addPage();
  
  // Characters
  const characters = sources.filter(s => s.type === 'character');
  if (characters.length > 0) {
    writeTitle('Characters');
    for (const char of characters) {
      writeSubtitle(char.title);
      writeText(char.content, 0.3);
      if (char.characterDetails) {
        const details = char.characterDetails;
        if (details.role) writeText(`Role: ${details.role}`, 0.3);
        if (details.motivation) writeText(`Motivation: ${details.motivation}`, 0.3);
        if (details.flaw) writeText(`Flaw: ${details.flaw}`, 0.3);
        if (details.arc) writeText(`Arc: ${details.arc}`, 0.3);
      }
      currentY += 0.2;
    }
    currentY += 0.3;
  }
  
  // Locations
  const locations = sources.filter(s => s.type === 'location');
  if (locations.length > 0) {
    checkPageBreak(1);
    writeTitle('Locations');
    for (const loc of locations) {
      writeSubtitle(loc.title);
      writeText(loc.content, 0.3);
      currentY += 0.2;
    }
    currentY += 0.3;
  }
  
  // Lore/World
  const lore = sources.filter(s => s.type === 'lore');
  if (lore.length > 0) {
    checkPageBreak(1);
    writeTitle('World & Lore');
    for (const item of lore) {
      writeSubtitle(item.title);
      writeText(item.content, 0.3);
      currentY += 0.2;
    }
    currentY += 0.3;
  }
  
  // Beat Sheet
  const beatEntries = Object.entries(beatSheet).filter(([_, v]) => v);
  if (beatEntries.length > 0) {
    addPage();
    writeTitle('Beat Sheet');
    for (const [key, value] of beatEntries) {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').trim();
      writeSubtitle(formattedKey);
      writeText(value as string, 0.3);
      currentY += 0.1;
    }
  }
  
  // Outline
  if (outline.length > 0) {
    addPage();
    writeTitle('Outline');
    
    const writeOutlineNode = (node: OutlineNode, depth: number = 0) => {
      checkPageBreak(0.3);
      pdf.setFont('helvetica', depth === 0 ? 'bold' : 'normal');
      pdf.text(`${'  '.repeat(depth)}• ${node.title}`, LEFT_MARGIN + depth * 0.2, currentY);
      currentY += 0.2;
      pdf.setFont('helvetica', 'normal');
      
      for (const child of node.children) {
        writeOutlineNode(child, depth + 1);
      }
    };
    
    for (const node of outline) {
      writeOutlineNode(node);
      currentY += 0.1;
    }
  }
  
  // Notes
  if (notes.length > 0) {
    addPage();
    writeTitle('Notes');
    for (const note of notes) {
      if (note.title) writeSubtitle(note.title);
      writeText(note.content, 0.3);
      currentY += 0.2;
    }
  }
  
  // Download
  pdf.save(`${title.replace(/[^a-z0-9]/gi, '_')}_Story_Bible.pdf`);
}

// Helper function to download files
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export all formats
export const ExportService = {
  exportToPDF,
  exportToFountain,
  exportToFDX,
  exportStoryBiblePDF,
};

export default ExportService;

