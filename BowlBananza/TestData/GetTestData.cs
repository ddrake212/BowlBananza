using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace BowlBananza.TestData
{
    public class SampleData<T>
    {
        public List<T> Load(string relativePath)
        {
            string fullPath = Path.Combine(AppContext.BaseDirectory, relativePath);

            if (!File.Exists(fullPath))
                throw new FileNotFoundException($"JSON file not found at path: {fullPath}");

            string json = File.ReadAllText(fullPath);
            return GetData(json);
        }

        public List<T> GetData(string json)
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            // 🔑 This tells System.Text.Json to parse string enums like "postseason"
            // into enum values like SeasonType.Postseason, DivisionClassification.Fbs, etc.
            options.Converters.Add(
                new JsonStringEnumConverter(JsonNamingPolicy.CamelCase, allowIntegerValues: true)
            );

            var items = JsonSerializer.Deserialize<List<T>>(json, options)
                        ?? new List<T>();

            return items;
        }
    }
}
