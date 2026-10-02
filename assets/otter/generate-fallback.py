"""Generate the static SVG from the RML drawing (Python standard library)."""
from pathlib import Path
import xml.etree.ElementTree as ET

HERE = Path(__file__).resolve().parent
root = ET.parse(HERE / "scene.rml").getroot()

def render(element):
    tag = element.tag
    if tag in ("Node", "Shape"):
        transform = f"translate({element.get('x', '0')} {element.get('y', '0')})"
        if element.get('rotation'):
            transform += f" rotate({float(element.get('rotation')) * 180 / 3.141592653589793})"
        contents = ""
        if tag == "Shape":
            color = element.find("Fill/SolidColor").get("colorValue")
            fill = "#" + color[2:]
            ellipse = element.find("Ellipse")
            if ellipse is not None:
                contents = f'<ellipse rx="{float(ellipse.get("width"))/2}" ry="{float(ellipse.get("height"))/2}" fill="{fill}"/>'
            else:
                vertices = element.findall("PointsPath/StraightVertex")
                if vertices:
                    points = " ".join(f"{v.get('x')},{v.get('y')}" for v in vertices)
                    contents = f'<polygon points="{points}" fill="{fill}"/>'
        else:
            contents = "".join(render(child) for child in reversed(list(element)))
        return f'<g transform="{transform}">{contents}</g>'
    return ""

artboard = root.find("Artboard")
svg = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="340" viewBox="0 0 320 340">'
svg += "".join(render(child) for child in reversed(list(artboard))) + "</svg>"
(HERE / "otter.svg").write_text(svg)
