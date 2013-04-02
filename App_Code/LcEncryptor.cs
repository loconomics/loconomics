using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Security.Cryptography;
using System.IO;

/// <summary>
/// Allow us encrypt and decrypt text using and internal key
/// </summary>
public class LcEncryptor 
{
    /// <summary>
    /// Generates a random, alphanumeric token, suitable for URL as segment and paramenter specially
    /// to generate privated-secure URLs.
    /// It tries to generated a unique value, but must be double checked saving it on database or something else, because
    /// the unique value is filtered to only alphanumeric chars.
    /// </summary>
    /// <param name="extraValue">Additional string to be concated to the auto-generated value before be encrypted</param>
    /// <returns></returns>
    public static string GenerateRandomToken(string extraValue)
    {
        return ConvertForURL(Encrypt(extraValue + Guid.NewGuid().ToString()));
    }

    /// <summary>
    /// Convert the given text in an alphanumeric token suitable for use as an URL segment or parameter.
    /// The result can be different from the source, is not a 'slug' function.
    /// </summary>
    /// <param name="text"></param>
    /// <returns></returns>
    public static string ConvertForURL(string text)
    {
        const string availableChars =
            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
        return new String(
            text
            .Select(b => availableChars[b % availableChars.Length])
            .ToArray()
        );
    }

    public static string Decrypt(string cipherText)
    {
        try
        {
            byte[] cipherBytes = Convert.FromBase64String(cipherText);
            Rfc2898DeriveBytes pdb = new Rfc2898DeriveBytes(_Pwd, _Salt);
            byte[] decryptedData = Decrypt(cipherBytes, pdb.GetBytes(32), pdb.GetBytes(16));
            return System.Text.Encoding.Unicode.GetString(decryptedData);
        }
        catch { }
        // If some error (normally when input text is not cipher, having a bad Base64String lenght)
        // return the original text; this allow pass an unencrypted text without crash.
        return cipherText;
    }

    private static byte[] Decrypt(byte[] cipherData, byte[] Key, byte[] IV) { 
        MemoryStream ms = new MemoryStream(); 
        CryptoStream cs = null;
        try {
            Rijndael alg = Rijndael.Create(); 
            alg.Key = Key; 
            alg.IV = IV; 
            cs = new CryptoStream(ms, alg.CreateDecryptor(), CryptoStreamMode.Write); 
            cs.Write(cipherData, 0, cipherData.Length); 
            cs.FlushFinalBlock();
            return ms.ToArray();
        }
        catch {
            return null;
        }
        finally {
            cs.Close(); 
        }
    }

    public static string Encrypt(string clearText)
    {
        byte[] clearBytes = System.Text.Encoding.Unicode.GetBytes(clearText);
        Rfc2898DeriveBytes pdb = new Rfc2898DeriveBytes(_Pwd, _Salt);
        byte[] encryptedData = Encrypt(clearBytes, pdb.GetBytes(32), pdb.GetBytes(16));
        return Convert.ToBase64String(encryptedData);
    }


    private static byte[] Encrypt(byte[] clearData, byte[] Key, byte[] IV)
    {
        MemoryStream ms = new MemoryStream();
        CryptoStream cs = null;
        try
        {
            Rijndael alg = Rijndael.Create();
            alg.Key = Key;
            alg.IV = IV;
            cs = new CryptoStream(ms, alg.CreateEncryptor(), CryptoStreamMode.Write);
            cs.Write(clearData, 0, clearData.Length);
            cs.FlushFinalBlock();
            return ms.ToArray();
        }
        catch
        {
            return null;
        }
        finally
        {
            cs.Close();
        }
    }

    static string _Pwd = "loco12$secret!";
    static byte[] _Salt = new byte[] {0x45, 0xF1, 0x61, 0x6e, 0x20, 0x00,  0x65, 0x64, 0x76, 0x65, 0x64, 0x03, 0x76};
}