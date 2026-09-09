-- One flight-sync subscription per user.
--
-- Subscription lookups moved from (user_id, tail_number) to user_id alone
-- (SubscriptionService, SubscriptionRepository.findByUser). The entity now
-- declares @JoinColumn(user_id, unique = true), and with ddl-auto=update
-- Hibernate adds the constraint on boot -- this file is the explicit record
-- and covers any DB where ddl-auto is off.
--
-- No real users yet, so the dedupe below only clears leftover test rows.
-- Keeps the lowest id per user. Run once.

DELETE FROM subscriptions
WHERE id NOT IN (SELECT min(id) FROM subscriptions GROUP BY user_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_subscriptions_user'
    ) THEN
        ALTER TABLE subscriptions ADD CONSTRAINT uq_subscriptions_user UNIQUE (user_id);
    END IF;
END $$;
