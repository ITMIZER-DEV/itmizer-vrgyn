import pandas as pd
import json
import sys
import os

def read_excel(file_path, output_path):
    try:
        if not os.path.exists(file_path):
            print(f"Error: File not found at {file_path}", file=sys.stderr)
            sys.exit(1)
            
        xls = pd.ExcelFile(file_path)
        data = {}
        for sheet_name in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name=sheet_name)
            # Replace NaN with None for JSON serialization
            df = df.where(pd.notnull(df), None)
            data[sheet_name] = df.to_dict(orient='records')
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Success: Saved to {output_path}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    read_excel("d:/projetos/vrsoftware-validacao-postgresql18/itmizer-VR/planilha_requisitos.xlsx", "spreadsheet_data_utf8.json")
