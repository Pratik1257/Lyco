using Microsoft.AspNetCore.Mvc;
using Lyco.Api.Services;
using Lyco.Api.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace Lyco.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;

    public AuthController(IUserService userService)
    {
        _userService = userService;
    }

    [AllowAnonymous]
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

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] AuthRegisterRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (dto, error) = await _userService.AuthRegisterAsync(req);
        if (error != null) return BadRequest(new { Message = error });

        return Ok(dto);
    }

    [AllowAnonymous]
    [HttpPost("send-verification")]
    public async Task<IActionResult> SendVerification([FromBody] SendVerificationRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email)) return BadRequest(new { Message = "Email is required" });

        var (success, code, error) = await _userService.SendVerificationCodeAsync(req.Email);
        if (!success) return BadRequest(new { Message = error });

        return Ok(new { Message = "Verification code sent", Code = code });
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
    {
        Console.WriteLine($"[Forgot Password] Received username: '{req.Username}'");
        if (string.IsNullOrWhiteSpace(req.Username)) return BadRequest(new { Message = "Username is required" });

        var (email, error) = await _userService.ForgotPasswordAsync(req.Username);
        if (error != null) return BadRequest(new { Message = error });

        return Ok(new { Email = email });
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var (success, error) = await _userService.ResetPasswordAsync(req);
        if (!success) return BadRequest(new { Message = error });

        return Ok(new { Message = "Password updated successfully" });
    }

    [AllowAnonymous]
    [HttpGet("check-username")]
    public async Task<IActionResult> CheckUsername([FromQuery] string username)
    {
        if (string.IsNullOrWhiteSpace(username)) return BadRequest(new { Message = "Username is required" });
        var exists = await _userService.UsernameExistsAsync(username);
        return Ok(new { Available = !exists });
    }

    [AllowAnonymous]
    [HttpGet("check-email")]
    public async Task<IActionResult> CheckEmail([FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email)) return BadRequest(new { Message = "Email is required" });
        var exists = await _userService.EmailExistsAsync(email);
        return Ok(new { Available = !exists });
    }

    [AllowAnonymous]
    [HttpGet("check-card")]
    public async Task<IActionResult> CheckCard([FromQuery] string cardNo)
    {
        if (string.IsNullOrWhiteSpace(cardNo)) return BadRequest(new { Message = "Card number is required" });
        var exists = await _userService.CardExistsAsync(cardNo);
        return Ok(new { Available = !exists });
    }
}
