using System.IO;

namespace Vietsov.Api.Services;

public interface IUploadService
{
    Task<string> UploadImageAsync(Stream fileStream, string fileName, string contentType);
    string GetFileUrl(string filename);
    Task DeleteFileAsync(string filename);
}

public class UploadService : IUploadService
{
    private readonly string _uploadPath;
    private readonly ILogger<UploadService> _logger;
    private readonly long _maxFileSize;
    private readonly string[] _allowedExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
    private readonly string[] _allowedMimeTypes = { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };

    public UploadService(IConfiguration configuration, ILogger<UploadService> logger, IWebHostEnvironment environment)
    {
        _logger = logger;
        var uploadDir = configuration["FileUpload:Path"] ?? "uploads/images";
        _uploadPath = Path.Combine(environment.WebRootPath, uploadDir);
        _maxFileSize = long.Parse(configuration["FileUpload:MaxSize"] ?? "5242880"); // 5MB default

        // Ensure upload directory exists
        if (!Directory.Exists(_uploadPath))
        {
            Directory.CreateDirectory(_uploadPath);
        }
    }

    public async Task<string> UploadImageAsync(Stream fileStream, string fileName, string contentType)
    {
        // Validate file type
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        if (!_allowedExtensions.Contains(ext))
        {
            throw new InvalidOperationException("Invalid file type. Only images are allowed.");
        }

        if (!_allowedMimeTypes.Contains(contentType.ToLowerInvariant()))
        {
            throw new InvalidOperationException("Invalid file type. Only images are allowed.");
        }

        // Validate file size
        if (fileStream.Length > _maxFileSize)
        {
            throw new InvalidOperationException($"File size exceeds maximum allowed size of {_maxFileSize / 1024 / 1024}MB");
        }

        // Generate unique filename
        var uniqueSuffix = DateTime.UtcNow.Ticks + "-" + Guid.NewGuid().ToString("N")[..8];
        var newFileName = $"image-{uniqueSuffix}{ext}";
        var filePath = Path.Combine(_uploadPath, newFileName);

        // Save file
        using (var fileStreamOut = new FileStream(filePath, FileMode.Create))
        {
            await fileStream.CopyToAsync(fileStreamOut);
        }

        return newFileName;
    }

    public string GetFileUrl(string filename)
    {
        return $"/uploads/images/{filename}";
    }

    public async Task DeleteFileAsync(string filename)
    {
        var filePath = Path.Combine(_uploadPath, filename);
        if (File.Exists(filePath))
        {
            await Task.Run(() => File.Delete(filePath));
        }
    }
}

