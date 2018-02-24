**To set your sleep schedule:** Type `+set` followed by a supported schedule name. For example, if you wanted to change your schedule to DC1, you would type `+set DC1`. You may also specify a schedule variant by using a dash separator, e.g. `+set DC1-extended` (supported variants are shortened extended flipped modified and recovery). Experimental unlisted schedules can be set with `+set Experimental`.
**To set your napchart:** Type `+set` followed by the napchart link. For example, `+set https://napchart.com/ro1mi`. To remove your chart instead, use none in place of a link.
**To set both at the same time:** Just specify both. For example, `+set DC1 https://napchart.com/ro1mi`<br/>
(Please note that if you change schedules without also setting a napchart, any existing napchart you have will be automatically removed.)
**To look up your own napchart:** Type `+get`.
**To look up someone else's napchart:** Type `+get` followed by the name of the user. Any of the following name formats will work: `+get Username`, `+get Username#0001`, `+get @0001`. Mentions should be avoided though as these will ping the user in question.
**To create a new napchart:** Type `+create` followed by a series of time ranges. For example, `+create 03:00-05:00 08:00-08:20 14:00-14:20 21:00-23:00`. A napchart link will then be generated for you. (If you want to set it, you will have to do that manually afterwards)
**To count number of people on each schedule:** Type `+schedulecount`.
**To list all members sorted by schedule:** Type `+memberlist`.
**To list all members with napcharts set:** Type `+chartlist`.
**To join/leave the watch group for users of NMO:** Type `+togglewatchgroup`.
-----------------------------------------------