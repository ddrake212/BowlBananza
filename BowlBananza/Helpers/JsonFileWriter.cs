using System;
using System.IO;
using System.Text.Json;

namespace BowlBananza.Helpers
{
    public static class JsonFileWriter
    {
        public static void WriteToJsonFile<T>(T data, string relativePath)
        {
            if (data == null) throw new ArgumentNullException(nameof(data));
            if (string.IsNullOrWhiteSpace(relativePath)) throw new ArgumentException("Path cannot be empty", nameof(relativePath));

            // Resolve relative path based on the calling app's base directory
            var fullPath = Path.Combine(AppContext.BaseDirectory, relativePath);

            // Ensure directory exists
            var directory = Path.GetDirectoryName(fullPath);
            if (!string.IsNullOrEmpty(directory))
            {
                Directory.CreateDirectory(directory);
            }

            var options = new JsonSerializerOptions
            {
                WriteIndented = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            var json = JsonSerializer.Serialize(data, options);

            // Create or overwrite
            File.WriteAllText(fullPath, json);
        }
    }
}
