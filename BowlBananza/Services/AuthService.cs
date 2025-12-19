using BowlBananza.Data;
using BowlBananza.Helpers;
using BowlBananza.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace BowlBananza.Services
{
    public class AuthService
    {
        private readonly AppDbContext db;
        public AuthService(AppDbContext dbContext) { db = dbContext; }

        public async Task<bool> UpdatePassword(string pw, int userId)
        {
            var hashed = PasswordHelper.Hash(pw);
            var user = await db.BBUsers.FirstOrDefaultAsync(u => u.Id == userId);
            user.Password = hashed;
            db.BBUsers.Update(user);
            try
            {
                db.SaveChanges();
                return true;
            }
            catch (Exception ex)
            {

            }
            return false;
        }

        public async Task<User?> ValidateLoginAsync(string username, string password)
        {
            var lowerUser = username.ToLower();
            var hashed = PasswordHelper.Hash(password);
            return await db.BBUsers.FirstOrDefaultAsync(u =>
                (u.Username.ToLower() == lowerUser || u.Email.ToLower() == lowerUser) &&
                u.Password == hashed
            );
        }

        public async Task<bool> IsUserSubmitted(int userId)
        {
            var year = SeasonHelper.GetCurrentSeasonYear();
            var submitted = await db.UserSubmitted.FirstOrDefaultAsync(u =>
                u.UserId == userId && u.Submitted
                && u.Year == year
            );
            return submitted != null;
        }

        public async Task<BowlData?> GetBowlData()
        {
            var year = SeasonHelper.GetCurrentSeasonYear();
            return await db.BowlData.FirstOrDefaultAsync(u =>
                u.Year == year
            );
        }

        public async Task<bool> IsLocked()
        {
            var year = SeasonHelper.GetCurrentSeasonYear();
            var isLocked = await db.BowlData.FirstOrDefaultAsync(u =>
                u.IsLocked == true
                && u.Year == year
            );
            return isLocked != null;
        }

        public async Task<User?> CheckUserAsync(string email)
        {
            try
            {
                var lowerUser = email.ToLower();
                return await db.BBUsers.FirstOrDefaultAsync(u =>
                    u.Email.ToLower() == lowerUser || u.Username.ToLower() == lowerUser
                );
            }
            catch (SystemException e)
            {
                return null;
            }
        }

        public async Task<User?> AddUser(User request)
        {
            request.Password = PasswordHelper.Hash(request.Password);

            db.BBUsers.Add(request);
            await db.SaveChangesAsync();

            return request;
        }
    }
}
