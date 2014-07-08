using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Drawing2D;

/// <summary>
/// Utilities to transform image files.
/// </summary>
public static class LcImaging
{
    #region Sizing
	public enum AnchorPosition
	{
		Start,
		Center,
		End
	}
    public enum SizeMode
    {
        Contain,
        Cover
    }
    public static Image Resize(
        Image imgPhoto,
        int Width,
        int Height,
        SizeMode sizeMode = SizeMode.Cover,
        AnchorPosition Anchor = AnchorPosition.Center)
    {
        int sourceWidth = imgPhoto.Width;
        int sourceHeight = imgPhoto.Height;
        int sourceX = 0;
        int sourceY = 0;
        int destX = 0;
        int destY = 0; 

        float nPercent = 0;
        float nPercentW = 0;
        float nPercentH = 0;

        nPercentW = ((float)Width/(float)sourceWidth);
        nPercentH = ((float)Height/(float)sourceHeight);
        switch (sizeMode)
        {
            case SizeMode.Contain:
                if (nPercentH < nPercentW)
                {
                    nPercent = nPercentH;
                    destX = (int)((Width - (sourceWidth * nPercent)) / 2);
                }
                else
                {
                    nPercent = nPercentW;
                    destY = (int)((Height - (sourceHeight * nPercent)) / 2);
                }
                break;
            case SizeMode.Cover:
                if(nPercentH < nPercentW)
                {
                    nPercent = nPercentW;
                    switch(Anchor)
                    {
                        case AnchorPosition.Start:
                            destY = 0;
                            break;
                        case AnchorPosition.End:
                            destY = (int)
                                (Height - (sourceHeight * nPercent));
                                break;
                        default:
                            destY = (int)
                                ((Height - (sourceHeight * nPercent))/2);
                            break;
                    }
                }
                else
                {
                    nPercent = nPercentH;
                    switch(Anchor)
                    {
                        case AnchorPosition.Start:
                            destX = 0;
                            break;
                        case AnchorPosition.End:
                            destX = (int)
                              (Width - (sourceWidth * nPercent));
                            break;
                        default:
                            destX = (int)
                              ((Width - (sourceWidth * nPercent))/2);
                            break;
                    }
                }
                break;
        }

        int destWidth  = (int)(sourceWidth * nPercent);
        int destHeight = (int)(sourceHeight * nPercent);

        Bitmap bmPhoto = new Bitmap(Width, Height, 
                          PixelFormat.Format24bppRgb);
        bmPhoto.SetResolution(imgPhoto.HorizontalResolution, 
                         imgPhoto.VerticalResolution);

        Graphics grPhoto = Graphics.FromImage(bmPhoto);
        if (sizeMode == SizeMode.Contain)
            grPhoto.Clear(Color.Black);
        grPhoto.InterpolationMode = 
                InterpolationMode.HighQualityBicubic;

        grPhoto.DrawImage(imgPhoto, 
            new Rectangle(destX, destY, destWidth, destHeight),
            new Rectangle(sourceX, sourceY, sourceWidth, sourceHeight),
            GraphicsUnit.Pixel);

        grPhoto.Dispose();
        return bmPhoto;
    }

    public static Image Crop(
        Image imgPhoto,
        int startX,
        int startY,
        int Width,
        int Height)
    {
        if (Width <= 0)
        {
            Width = imgPhoto.Width;
        }
        if (Height <= 0)
        {
            Height = imgPhoto.Height;
        }

        Bitmap bmPhoto = new Bitmap(Width, Height);
        bmPhoto.SetResolution(imgPhoto.HorizontalResolution, imgPhoto.VerticalResolution);

        using (Graphics grPhoto = Graphics.FromImage(bmPhoto))
        {
            grPhoto.SmoothingMode = SmoothingMode.AntiAlias;
            grPhoto.InterpolationMode = InterpolationMode.HighQualityBicubic;
            grPhoto.PixelOffsetMode = PixelOffsetMode.HighQuality;

            grPhoto.DrawImage(imgPhoto, new Rectangle(0, 0, Width, Height), startX, startY, Width, Height, GraphicsUnit.Pixel);
        }
        return bmPhoto;
    }
    #endregion

    #region Filters
    /// <summary>
    /// Converts an image to grayscale
    /// </summary>
    /// <param name="Image">Image to change</param>
    /// <returns>A bitmap object of the black and white image</returns>
    public static Image Grayscale(Image image)
    {
        return ApplyMatrix(image,
                new float[][]{
                    new float[] {.3f, .3f, .3f, 0, 0},
                    new float[] {.59f, .59f, .59f, 0, 0},
                    new float[] {.11f, .11f, .11f, 0, 0},
                    new float[] {0, 0, 0, 1, 0},
                    new float[] {0, 0, 0, 0, 1}
                }
            );
    }
    public static Image Grayscale(string path)
    {
        return Grayscale(new Bitmap(path));
    }
    
    /// <summary>
    /// Applies a color matrix to a Bitmap
    /// </summary>
    /// <param name="OriginalImage">Image sent in</param>
    /// <param name="Matrix">Matrix being apply</param>
    /// <returns>An image with the color matrix applied</returns>
    public static Image ApplyMatrix(Image OriginalImage, float[][] Matrix)
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
        // OriginalImage Must be disposed to avoid file locking
        OriginalImage.Dispose();
        return NewBitmap;
    }
    #endregion
}
