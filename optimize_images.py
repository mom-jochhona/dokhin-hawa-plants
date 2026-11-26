
from pathlib import Path
from PIL import Image, ImageOps

SOURCE_DIR = Path("images")
OUTPUT_DIR = Path("images-optimized")

MAX_DIMENSION = 1600
WEBP_QUALITY = 82


def optimize_image(source_path):
    relative_path = source_path.relative_to(SOURCE_DIR)
    output_path = (OUTPUT_DIR / relative_path).with_suffix(".webp")

    output_path.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(source_path) as image:
        # Apply EXIF orientation before resizing.
        image = ImageOps.exif_transpose(image)

        # Convert to RGB for WebP compatibility.
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")

        # Resize only when necessary, preserving aspect ratio.
        image.thumbnail(
            (MAX_DIMENSION, MAX_DIMENSION),
            Image.Resampling.LANCZOS
        )

        image.save(
            output_path,
            "WEBP",
            quality=WEBP_QUALITY,
            method=6
        )

    return output_path


def main():
    image_files = [
        path for path in SOURCE_DIR.rglob("*")
        if path.is_file() and path.suffix.lower() in (".jpg", ".jpeg")
    ]

    original_size = sum(path.stat().st_size for path in image_files)
    optimized_files = []

    for path in image_files:
        try:
            optimized_files.append(optimize_image(path))
        except Exception as error:
            print(f"ERROR: {path}: {error}")

    optimized_size = sum(
        path.stat().st_size for path in optimized_files
    )

    print(f"\nImages found: {len(image_files)}")
    print(f"Images optimized: {len(optimized_files)}")
    print(f"Original size: {original_size / 1024**2:.2f} MB")
    print(f"Optimized size: {optimized_size / 1024**2:.2f} MB")

    if original_size:
        reduction = (1 - optimized_size / original_size) * 100
        print(f"Storage reduction: {reduction:.1f}%")


if __name__ == "__main__":
    main()
