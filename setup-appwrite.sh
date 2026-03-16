#!/bin/bash
set -e

ENDPOINT="https://nyc.cloud.appwrite.io/v1"
PROJECT="698d5a490007a7ec0e2e"
API_KEY="standard_9841a370c44631ff073e00a624d4837d36332330b7fc484049dc152eddd8201e45d9dee7bffff50a6fa1eebcc5c8e0db28557d416ea96520f524842b93cc7467c2a823e81e0c087165266ec5b4c0e0dd6ce11accf7ae373e691fab39af39eed7f0fb7ff2341b35dd91e125f945db94dd1b481311e403ad17839bdc2a614c87b0"
DB="ironlog"

H1="X-Appwrite-Project: $PROJECT"
H2="X-Appwrite-Key: $API_KEY"
H3="Content-Type: application/json"

api() {
  local method=$1 path=$2 data=$3
  local resp
  if [ -n "$data" ]; then
    resp=$(curl -s -X "$method" "$ENDPOINT$path" -H "$H1" -H "$H2" -H "$H3" -d "$data")
  else
    resp=$(curl -s -X "$method" "$ENDPOINT$path" -H "$H1" -H "$H2" -H "$H3")
  fi
  echo "$resp"
  # Check for error
  if echo "$resp" | grep -q '"message"'; then
    if echo "$resp" | grep -q '"code":4'; then
      echo "  ⚠️  Warning (may already exist)"
    fi
  fi
}

echo "═══════════════════════════════════════════════"
echo "  Creating IronLog Database on Appwrite"
echo "═══════════════════════════════════════════════"

# ─── Create Database ───
echo ""
echo "📦 Creating database: $DB"
api POST "/databases" "{\"databaseId\":\"$DB\",\"name\":\"IronLog\",\"enabled\":true}"

PERMS='["read(\"users\")","create(\"users\")","update(\"users\")","delete(\"users\")"]'

create_collection() {
  local id=$1 name=$2
  echo ""
  echo "📋 Creating collection: $name ($id)"
  api POST "/databases/$DB/collections" "{\"collectionId\":\"$id\",\"name\":\"$name\",\"permissions\":$PERMS,\"documentSecurity\":false,\"enabled\":true}"
}

str_attr() {
  local coll=$1 key=$2 size=$3 required=${4:-true} array=${5:-false} default_val=${6:-}
  echo "  + string: $key (size=$size, req=$required, array=$array)"
  local body="{\"key\":\"$key\",\"size\":$size,\"required\":$required,\"array\":$array"
  if [ -n "$default_val" ]; then
    body="$body,\"default\":\"$default_val\""
  fi
  body="$body}"
  api POST "/databases/$DB/collections/$coll/attributes/string" "$body" > /dev/null 2>&1
}

int_attr() {
  local coll=$1 key=$2 required=${3:-true} default_val=${4:-}
  echo "  + integer: $key (req=$required)"
  local body="{\"key\":\"$key\",\"required\":$required"
  if [ -n "$default_val" ]; then
    body="$body,\"default\":$default_val"
  fi
  body="$body}"
  api POST "/databases/$DB/collections/$coll/attributes/integer" "$body" > /dev/null 2>&1
}

float_attr() {
  local coll=$1 key=$2 required=${3:-true}
  echo "  + float: $key (req=$required)"
  api POST "/databases/$DB/collections/$coll/attributes/float" "{\"key\":\"$key\",\"required\":$required}" > /dev/null 2>&1
}

bool_attr() {
  local coll=$1 key=$2 required=${3:-true}
  echo "  + boolean: $key (req=$required)"
  api POST "/databases/$DB/collections/$coll/attributes/boolean" "{\"key\":\"$key\",\"required\":$required}" > /dev/null 2>&1
}

dt_attr() {
  local coll=$1 key=$2 required=${3:-true}
  echo "  + datetime: $key (req=$required)"
  api POST "/databases/$DB/collections/$coll/attributes/datetime" "{\"key\":\"$key\",\"required\":$required}" > /dev/null 2>&1
}

create_index() {
  local coll=$1 key=$2 type=$3 attrs=$4 orders=${5:-}
  echo "  🔍 index: $key ($type on $attrs)"
  local body="{\"key\":\"$key\",\"type\":\"$type\",\"attributes\":$attrs"
  if [ -n "$orders" ]; then
    body="$body,\"orders\":$orders"
  fi
  body="$body}"
  api POST "/databases/$DB/collections/$coll/indexes" "$body" > /dev/null 2>&1
}

# ═══════════════════════════════════════════════
# 1. exercises
# ═══════════════════════════════════════════════
create_collection "exercises" "Exercises"
str_attr exercises name 256
str_attr exercises muscleGroup 64
str_attr exercises secondaryMuscles 128 false true
str_attr exercises equipment 64
str_attr exercises difficulty 32
str_attr exercises icon 64 false
str_attr exercises instructions 8192 false

sleep 2
create_index exercises idx_name key '["name"]'

# ═══════════════════════════════════════════════
# 2. programs
# ═══════════════════════════════════════════════
create_collection "programs" "Programs"
str_attr programs userId 128
str_attr programs name 256
int_attr programs daysPerWeek true
int_attr programs currentWeek true "1"
int_attr programs totalWeeks true "12"

sleep 2
create_index programs idx_userId key '["userId"]'

# ═══════════════════════════════════════════════
# 3. program_days
# ═══════════════════════════════════════════════
create_collection "program_days" "Program Days"
str_attr program_days programId 128
str_attr program_days userId 128
str_attr program_days name 256
int_attr program_days order true
str_attr program_days exercises 65535

sleep 2
create_index program_days idx_programId key '["programId"]'
create_index program_days idx_userId key '["userId"]'

# ═══════════════════════════════════════════════
# 4. workout_sessions
# ═══════════════════════════════════════════════
create_collection "workout_sessions" "Workout Sessions"
str_attr workout_sessions userId 128
str_attr workout_sessions programDayId 128 false
str_attr workout_sessions programDayName 256
str_attr workout_sessions startedAt 64
str_attr workout_sessions completedAt 64 false
float_attr workout_sessions totalVolume false
int_attr workout_sessions duration false
str_attr workout_sessions notes 4096 false

sleep 2
create_index workout_sessions idx_userId key '["userId"]'
create_index workout_sessions idx_startedAt key '["startedAt"]' '["desc"]'

# ═══════════════════════════════════════════════
# 5. workout_sets
# ═══════════════════════════════════════════════
create_collection "workout_sets" "Workout Sets"
str_attr workout_sets sessionId 128
str_attr workout_sets userId 128
str_attr workout_sets exerciseId 128
int_attr workout_sets setNumber true
float_attr workout_sets weight true
int_attr workout_sets reps true
bool_attr workout_sets isCompleted true
float_attr workout_sets rpe false

sleep 2
create_index workout_sets idx_sessionId key '["sessionId"]'
create_index workout_sets idx_exercise key '["userId","exerciseId"]'

# ═══════════════════════════════════════════════
# 6. personal_records
# ═══════════════════════════════════════════════
create_collection "personal_records" "Personal Records"
str_attr personal_records userId 128
str_attr personal_records exerciseId 128
str_attr personal_records exerciseName 256
float_attr personal_records weight true
int_attr personal_records reps true
float_attr personal_records estimated1RM true
str_attr personal_records achievedAt 64

sleep 2
create_index personal_records idx_userId key '["userId"]'
create_index personal_records idx_exercise key '["userId","exerciseId"]'

# ═══════════════════════════════════════════════
# 7. social_posts
# ═══════════════════════════════════════════════
create_collection "social_posts" "Social Posts"
str_attr social_posts userId 128
str_attr social_posts userName 256
str_attr social_posts avatarColor 32
str_attr social_posts sessionId 128 false
str_attr social_posts text 4096
str_attr social_posts stats 2048 false
bool_attr social_posts isPR false
int_attr social_posts likes false "0"
str_attr social_posts likedBy 128 false true

sleep 2
create_index social_posts idx_createdAt key '["$createdAt"]' '["desc"]'

# ═══════════════════════════════════════════════
# 8. user_profiles
# ═══════════════════════════════════════════════
create_collection "user_profiles" "User Profiles"
str_attr user_profiles userId 128
str_attr user_profiles displayName 256
str_attr user_profiles avatarColor 32 false "#e8ff47"
int_attr user_profiles streakCount false "0"
str_attr user_profiles lastWorkoutDate 64 false
int_attr user_profiles weeklyGoal false "5"

sleep 2
create_index user_profiles idx_userId unique '["userId"]'

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ All done! Database 'ironlog' is ready."
echo "═══════════════════════════════════════════════"
echo ""
echo "Add to your .env:"
echo "  EXPO_PUBLIC_APPWRITE_ENDPOINT=$ENDPOINT"
echo "  EXPO_PUBLIC_APPWRITE_PROJECT_ID=$PROJECT"
