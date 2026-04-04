#!/usr/bin/env python3
"""
Extract admission score tables from score2025.pdf
Output: JSON file with structured score data
"""

import json
import sys
import os
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print("Error: pdfplumber not installed. Install with: pip install pdfplumber")
    sys.exit(1)

def extract_scores_from_pdf(pdf_path):
    """
    Extract score data from PDF tables
    Returns list of dictionaries with keys:
    - establishment_name
    - city
    - specialty_name
    - score_2025
    """
    results = []
    
    with pdfplumber.open(pdf_path) as pdf:
        total_pages = len(pdf.pages)
        print(f"Processing {total_pages} pages...")
        
        for page_num, page in enumerate(pdf.pages, 1):
            print(f"\nPage {page_num}/{total_pages}")
            
            # Extract tables from the page
            tables = page.extract_tables()
            
            if not tables:
                print(f"  No tables found")
                continue
            
            print(f"  Found {len(tables)} table(s)")
            
            for table_idx, table in enumerate(tables):
                print(f"    Processing table {table_idx + 1}...")
                
                if not table or len(table) < 2:
                    print(f"      Table too small, skipping")
                    continue
                
                # Analyze table structure
                header = table[0]
                header_text = " | ".join([str(h) for h in header if h])
                print(f"      Headers: {header_text[:80]}")
                
                # Try to detect column indices for our target fields
                # Look for keywords in headers
                col_indices = find_column_indices(header)
                
                if not col_indices:
                    print(f"      Could not identify columns, showing first row:")
                    print(f"      {table[1]}")
                    continue
                
                print(f"      Detected columns: {col_indices}")
                
                # Extract data rows
                for row_idx, row in enumerate(table[1:], 1):
                    try:
                        record = extract_record_from_row(row, col_indices)
                        if record and record.get('score_2025'):
                            results.append(record)
                            print(f"        Row {row_idx}: {record['establishment_name'][:30]} | {record['specialty_name'][:30]} | {record['score_2025']}")
                    except Exception as e:
                        print(f"        Row {row_idx}: Error - {str(e)[:50]}")
    
    return results

def find_column_indices(header):
    """
    Detect column indices based on header keywords
    Returns dict with keys: establishment, city, specialty, score
    """
    indices = {}
    header_lower = [str(h).lower() if h else "" for h in header]
    
    # Look for keywords
    for idx, text in enumerate(header_lower):
        if any(kw in text for kw in ['établissement', 'establishment', 'école', 'faculté', 'institut', 'etablissem']):
            indices['establishment'] = idx
        elif any(kw in text for kw in ['ville', 'city', 'localité']):
            indices['city'] = idx
        elif any(kw in text for kw in ['filière', 'spécialité', 'specialty', 'speciality', 'programme']):
            indices['specialty'] = idx
        elif any(kw in text for kw in ['score', 'seuil', 'moyenne', 'admission', '2025']):
            indices['score'] = idx
    
    # If not all columns found, try by position
    if len(indices) < 4:
        # Assume standard layout
        if len(header) >= 4:
            if 'establishment' not in indices:
                indices['establishment'] = 0
            if 'city' not in indices:
                indices['city'] = 1
            if 'specialty' not in indices:
                indices['specialty'] = 2
            if 'score' not in indices:
                indices['score'] = 3
    
    if len(indices) < 4:
        return None
    
    return indices

def extract_record_from_row(row, col_indices):
    """
    Extract a record from a table row
    """
    try:
        establishment = safe_get(row, col_indices.get('establishment'), '')
        city = safe_get(row, col_indices.get('city'), '')
        specialty = safe_get(row, col_indices.get('specialty'), '')
        score_str = safe_get(row, col_indices.get('score'), '')
        
        # Skip empty rows
        if not establishment or not specialty:
            return None
        
        # Parse score
        score = parse_score(score_str)
        if score is None:
            return None
        
        return {
            'establishment_name': str(establishment).strip(),
            'city': str(city).strip(),
            'specialty_name': str(specialty).strip(),
            'score_2025': score
        }
    except Exception as e:
        print(f"      Error extracting record: {e}")
        return None

def safe_get(row, idx, default=''):
    """Safely get value from row at index"""
    if idx is None or idx < 0:
        return default
    if idx >= len(row):
        return default
    val = row[idx]
    return val if val else default

def parse_score(score_str):
    """Parse score string to float"""
    if not score_str:
        return None
    
    score_str = str(score_str).strip()
    
    # Remove common non-numeric characters
    score_str = score_str.replace(',', '.').replace(' ', '')
    
    try:
        # Try to extract just the numeric part
        import re
        match = re.search(r'(\d+[.,]\d+|\d+)', score_str)
        if match:
            return float(match.group(1).replace(',', '.'))
    except:
        pass
    
    return None

def main():
    pdf_path = Path(__file__).parent.parent.parent / 'data' / 'raw' / 'score2025.pdf'
    
    if not pdf_path.exists():
        print(f"Error: PDF not found at {pdf_path}")
        sys.exit(1)
    
    print(f"Extracting from: {pdf_path}\n")
    
    results = extract_scores_from_pdf(str(pdf_path))
    
    print(f"\n\n{'='*60}")
    print(f"Extraction complete!")
    print(f"Total records extracted: {len(results)}")
    print(f"{'='*60}\n")
    
    if results:
        print("Sample records:")
        for record in results[:5]:
            print(f"  {record}")
        
        # Write output
        output_path = pdf_path.parent.parent / 'extracted' / '2025' / 'scores_2025.sample.json'
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        
        print(f"\n✓ Output written to: {output_path}")
    else:
        print("No records extracted. PDF structure may be different.")

if __name__ == '__main__':
    main()
