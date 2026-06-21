import PyPDF2
import io

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        
        text = ""
        for page in pdf_reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        
        if not text.strip():
            return "Could not extract text from this PDF."
        
        return text.strip()
    
    except Exception as e:
        print(f"PDF parsing error: {e}")
        return "Error reading PDF file."