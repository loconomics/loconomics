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
        AnchorPosition Anchor = AnchorPosition.Center,
        Color backgroundColor = default(Color))
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
        grPhoto.Clear(backgroundColor);

        grPhoto.SmoothingMode = SmoothingMode.HighQuality;
        grPhoto.InterpolationMode = InterpolationMode.HighQualityBilinear;
        grPhoto.PixelOffsetMode = PixelOffsetMode.HighQuality;

        grPhoto.DrawImage(imgPhoto, 
            new Rectangle(destX, destY, destWidth, destHeight),
            new Rectangle(sourceX, sourceY, sourceWidth, sourceHeight),
            GraphicsUnit.Pixel);

        grPhoto.Dispose();
        return bmPhoto;
    }

    public static Image Rotate(Image imgPhoto, float angle, Color backgroundColor)
    {
        if (angle != 0)
        {
            // Adjust angle
            angle = angle % 360;
            if (angle > 180)
            {
                angle -= 360;
            }

            // Choose pixel format, may depend on given back color
            var pf = default(System.Drawing.Imaging.PixelFormat);
            if (backgroundColor == Color.Transparent)
            {
                pf = System.Drawing.Imaging.PixelFormat.Format32bppArgb;
            }
            else
            {
                pf = imgPhoto.PixelFormat;
            }

            // Calculate the rotated width and height
            var sin = (float)Math.Abs(Math.Sin(angle * Math.PI / 180.0));
            var cos = (float)Math.Abs(Math.Cos(angle * Math.PI / 180.0));
            var newWidth = (float)imgPhoto.Height * sin + imgPhoto.Width * cos;
            var newHeight = (float)imgPhoto.Height * cos + imgPhoto.Width * sin;

            // Calculate rotation operation origin
            var originX = 0f;
            var originY = 0f;
            if (angle > 0)
            {
                if (angle <= 90)
                {
                    originX = sin * imgPhoto.Height;
                }
                else
                {
                    originX = newWidth;
                    originY = newHeight - sin * imgPhoto.Width;
                }
            }
            else
            {
                if (angle >= -90)
                {
                    originY = sin * imgPhoto.Width;
                }
                else
                {
                    originX = newWidth - sin * imgPhoto.Height;
                    originY = newHeight;
                }
            }

            // Create new image object
            Bitmap newPhoto = new Bitmap((int)newWidth, (int)newHeight, pf);

            // Prepare a 'canvas' and perform rotation
            Graphics grPhoto = Graphics.FromImage(newPhoto);
            // Paint background
            grPhoto.Clear(backgroundColor);
            // position where rotation will happens
            grPhoto.TranslateTransform(originX, originY);
            // rotate
            grPhoto.RotateTransform(angle);
            grPhoto.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
            // draw image at canvas
            grPhoto.DrawImageUnscaled(imgPhoto, new Point(0, 0));
            grPhoto.Dispose();

            return newPhoto;
        }
        else
        {
            return (Image)imgPhoto.Clone();
        }
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
            grPhoto.SmoothingMode = SmoothingMode.HighQuality;
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
