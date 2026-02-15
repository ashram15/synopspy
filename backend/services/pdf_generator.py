from weasyprint import HTML
from jinja2 import Environment, FileSystemLoader
from pathlib import Path

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"

env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=True
)


def generate_analysis_pdf(analysis: dict) -> bytes:
    template = env.get_template("analysis_pdf.html")
    html_content = template.render(**analysis)

    pdf_bytes = HTML(string=html_content).write_pdf()
    return pdf_bytes
