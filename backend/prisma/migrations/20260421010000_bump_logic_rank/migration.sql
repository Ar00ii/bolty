-- Bump the rank of the showcase user "Logic" (case-insensitive) to Legend.
-- The 9-tier rank ladder grants LEYENDA at >= 5000 reputation points.
-- This is idempotent: only updates when the current value is below the floor.
UPDATE users
   SET "reputationPoints" = 5200
 WHERE LOWER(username) = 'logic'
   AND "reputationPoints" < 5200;
