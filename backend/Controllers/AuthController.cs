using Microsoft.AspNetCore.Mvc;
using Lyco.Api.Services;
using Lyco.Api.DTOs;

namespace Lyco.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;

    public AuthController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (response, error) = await _userService.LoginAsync(req);
        if (error != null)
        {
            if (error.Contains("inactive")) return StatusCode(403, new { Message = error });
            return Unauthorized(new { Message = error });
        }

        return Ok(response);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] AuthRegisterRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (dto, error) = await _userService.AuthRegisterAsync(req);
        if (error != null) return BadRequest(new { Message = error });

        return Ok(dto);
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
    {
        Console.WriteLine($"[Forgot Password] Received username: '{req.Username}'");
        if (string.IsNullOrWhiteSpace(req.Username)) return BadRequest(new { Message = "Username is required" });

        var (email, error) = await _userService.ForgotPasswordAsync(req.Username);
        if (error != null) return BadRequest(new { Message = error });

        return Ok(new { Email = email });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (success, error) = await _userService.ResetPasswordAsync(req);
        if (!success) return BadRequest(new { Message = error });

        return Ok(new { Message = "Password updated successfully" });
    }
}
