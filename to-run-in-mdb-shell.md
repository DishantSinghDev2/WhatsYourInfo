// Keep event records for 30 days, then automatically delete them.
db.webhook_events.createIndex( { "createdAt": 1 }, { expireAfterSeconds: 2592000 } )