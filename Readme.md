## Booniebot 

Booniebot is a [HipChat](http://www.hipchat.com) bot that reads an xml feed from cricbuzz and posts today's games to HipChat in AEDT time.

### Usage

By default, Boonie gets up at 7am, cracks a tinnie, and lets you know who is playing today. But you can also run him ad-hoc as follows:

```
Usage: node booniebot.js

  -h, --help          Display this help
  -s, --start=ARG     Hour to start polling (e.g., 13:00 => 1 PM)
  -i, --interval=ARG  Interval in hours between pollings
  -d, --debug         Debug mode: post to the test room
  -o, --onetime       Skip scheduling. Only post one time, now
```

### Scheduling

Booniebot is self-scheduling, so there's no need to create a cron job. To start a background task from an ssh session, use the following command:

    sudo nohup node booniebot.js <arguments>

Then hit control+Z to suspend and enter `bg` to run the task in the background. To terminate, find Booniebot's PID (e.g., `ps aux | grep booniebot`) and then use `kill <pid>`.

If you prefer to have Booniebot run as a cron job, use the `--onetime` argument to run only once.
