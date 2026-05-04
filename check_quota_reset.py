#!/usr/bin/env python3
"""Check when free tier quota resets"""

from datetime import datetime, timedelta
import pytz

# Get current time in UTC
now_utc = datetime.now(pytz.UTC)

# Calculate next midnight UTC (quota reset time)
tomorrow_utc = (now_utc + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)

# Time remaining
time_remaining = tomorrow_utc - now_utc
hours = time_remaining.seconds // 3600
minutes = (time_remaining.seconds % 3600) // 60
seconds = time_remaining.seconds % 60

print("=" * 70)
print("📊 FREE TIER QUOTA RESET SCHEDULE")
print("=" * 70)
print(f"\n🕐 Current Time (UTC): {now_utc.strftime('%Y-%m-%d %H:%M:%S %Z')}")
print(f"🕐 Current Time (Local): {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

print(f"\n✅ QUOTA RESETS AT: {tomorrow_utc.strftime('%Y-%m-%d %H:%M:%S %Z')}")
print(f"\n⏱️  TIME REMAINING: {int(time_remaining.total_seconds())} seconds")
print(f"                  {hours}h {minutes}m {seconds}s")

# Show in different timezones
print("\n" + "=" * 70)
print("🌍 RESET TIME IN DIFFERENT TIMEZONES:")
print("=" * 70)

timezones = {
    'UTC': 'UTC',
    'India (IST)': 'Asia/Kolkata',
    'US East (EST)': 'US/Eastern',
    'US Pacific (PST)': 'US/Pacific',
    'UK (GMT)': 'Europe/London',
}

for name, tz_name in timezones.items():
    tz = pytz.timezone(tz_name)
    reset_time = tomorrow_utc.astimezone(tz)
    print(f"  {name:20} → {reset_time.strftime('%H:%M:%S on %b %d, %Y')}")

print("\n" + "=" * 70)
print("💡 OPTIONS:")
print("=" * 70)
print("  ❌ Wait for free reset: Lose ~12-18 hours (miss faculty demo)")
print("  ✅ Enable billing NOW: Get quota instantly + show faculty TODAY")
print("=" * 70)
