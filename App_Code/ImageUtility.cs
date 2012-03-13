using System;
using System.Drawing;
using System.Drawing.Imaging;

/// <summary>
/// Utilities to transform image files.
/// </summary>
public static class ImageUtility
{
    /// <summary>
    /// Converts an image to grayscale
    /// </summary>
    /// <param name="Image">Image to change</param>
    /// <returns>A bitmap object of the black and white image</returns>
    public static Bitmap ConvertGrayscale(Bitmap Image)
    {
        return ApplyMatrix(Image,
                new float[][]{
                    new float[] {.3f, .3f, .3f, 0, 0},
                    new float[] {.59f, .59f, .59f, 0, 0},
                    new float[] {.11f, .11f, .11f, 0, 0},
                    new float[] {0, 0, 0, 1, 0},
                    new float[] {0, 0, 0, 0, 1}
                }
            );
    }
    public static Bitmap ConvertGrayscale(string path)
    {
        return ConvertGrayscale(new Bitmap(path));
    }
    
    /// <summary>
    /// Applies a color matrix to a Bitmap
    /// </summary>
    /// <param name="OriginalImage">Image sent in</param>
    /// <param name="Matrix">Matrix being apply</param>
    /// <returns>An image with the color matrix applied</returns>
    public static Bitmap ApplyMatrix(Bitmap OriginalImage, float[][] Matrix)
    {
        // Creating a new bitmap to transform, same size
        Bitmap NewBitmap = new Bitmap(OriginalImage.Width, OriginalImage.Height);
        using (Graphics NewGraphics = Graphics.FromImage(NewBitmap))
        {
            // Set alpha channel (transparency bits) to white (by default, is converted to black)
            NewGraphics.Clear(Color.White);

            // Creating the color matrix with using our matrix
            System.Drawing.Imaging.ColorMatrix NewColorMatrix = new System.Drawing.Imaging.ColorMatrix(Matrix);
            using (ImageAttributes Attributes = new ImageAttributes())
            {
                // Applying the matrix
                Attributes.SetColorMatrix(NewColorMatrix);
                // Create the new transformed image
                NewGraphics.DrawImage(OriginalImage,
                    new System.Drawing.Rectangle(0, 0, OriginalImage.Width, OriginalImage.Height),
                    0, 0, OriginalImage.Width, OriginalImage.Height,
                    GraphicsUnit.Pixel,
                    Attributes);
            }
        }
        return NewBitmap;
    }
}
