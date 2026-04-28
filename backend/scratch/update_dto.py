import os

file_path = r'c:\Users\DELL\Desktop\Lyco\backend\DTOs\UserRegistrationDto.cs'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_text = '[MaxLength(200, ErrorMessage = "Website URL cannot exceed 200 characters")]\n    public string? WebsiteUrl { get; init; }'
new_text = '[RegularExpression(@"^(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})([/\\w .-]*)*\\/?$", ErrorMessage = "Invalid Website URL format")]\n    [MaxLength(200, ErrorMessage = "Website URL cannot exceed 200 characters")]\n    public string? WebsiteUrl { get; init; }'

# Try with different line endings
if old_text in content:
    content = content.replace(old_text, new_text)
elif old_text.replace('\n', '\r\n') in content:
    content = content.replace(old_text.replace('\n', '\r\n'), new_text.replace('\n', '\r\n'))
else:
    # Try without leading spaces in old_text but with spaces in search
    print("Old text not found exactly, trying with regex or manual search")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
