**History Commands**
If [user] is omitted, these commands default to you.
**Look up someone's schedule history** `+hist [user]`
**Look up someone's full schedule history** `+histfull [user]`
Full history does not merge any attempts and shows indices.
You need these indices to edit past schedules.

All dates must be in `yyyy-mm-dd` format, such as `2020-04-07`
**Add a schedule in the past** `+histadd [schedule-name] [start-date]`
**Remove a schedule in the past** `+histdel [index]`

__Moderators only__
**Add a schedule to someone's history** `+histadd [schedule-name] [start-date] [user]`
**Remove a schedule from someone's history** `+histdel [index] [user]`
**Set adapted to someone in the past** `+histadapt [index] [adapted-date] [user]`
**Verify someone's history** `+histverify [user]`
Editing history will automatically unverify the user's schedule. This protects the integrity of the database from being maliciously modified.
The purpose of these commands is to ensure the accuracy of the database to allow global scheduling statistics, such as success rate for each schedule and schedule popularity.
