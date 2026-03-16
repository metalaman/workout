#!/bin/bash
set -e

ENDPOINT="https://nyc.cloud.appwrite.io/v1"
PROJECT="698d5a490007a7ec0e2e"
API_KEY="standard_9841a370c44631ff073e00a624d4837d36332330b7fc484049dc152eddd8201e45d9dee7bffff50a6fa1eebcc5c8e0db28557d416ea96520f524842b93cc7467c2a823e81e0c087165266ec5b4c0e0dd6ce11accf7ae373e691fab39af39eed7f0fb7ff2341b35dd91e125f945db94dd1b481311e403ad17839bdc2a614c87b0"
DB_ID="698dd75900395a2e605e"

H1="X-Appwrite-Project: $PROJECT"
H2="X-Appwrite-Key: $API_KEY"
H3="Content-Type: application/json"

api() {
  curl -s -X "$1" "$ENDPOINT$2" -H "$H1" -H "$H2" -H "$H3" ${3:+-d "$3"}
}

echo "═══════════════════════════════════════════════"
echo "  Step 1: Delete existing collections"
echo "═══════════════════════════════════════════════"

for coll in exercises programs programdays workoutsessions workoutsets personalrecords socialposts userprofiles; do
  echo "  🗑️  Deleting $coll..."
  api DELETE "/databases/$DB_ID/collections/$coll" || true
  sleep 0.3
done

echo ""
echo "═══════════════════════════════════════════════"
echo "  Step 2: Create collections with correct IDs"
echo "═══════════════════════════════════════════════"

create_collection() {
  local id="$1" name="$2"
  echo "  📋 Creating: $name ($id)"
  api POST "/databases/$DB_ID/collections" \
    "{\"collectionId\":\"$id\",\"name\":\"$name\",\"permissions\":[\"read(\\\"any\\\")\",\"create(\\\"users\\\")\",\"update(\\\"users\\\")\",\"delete(\\\"users\\\")\"],\"documentSecurity\":false}"
  sleep 0.3
}

create_collection "exercises" "Exercises"
create_collection "programs" "Programs"
create_collection "program_days" "Program Days"
create_collection "workout_sessions" "Workout Sessions"
create_collection "workout_sets" "Workout Sets"
create_collection "personal_records" "Personal Records"
create_collection "social_posts" "Social Posts"
create_collection "user_profiles" "User Profiles"

echo ""
echo "═══════════════════════════════════════════════"
echo "  Step 3: Add attributes"
echo "═══════════════════════════════════════════════"

add_string() {
  local coll="$1" key="$2" size="$3" req="$4" arr="${5:-false}"
  echo "    + string: $key (size=$size, req=$req, array=$arr)"
  api POST "/databases/$DB_ID/collections/$coll/attributes/string" \
    "{\"key\":\"$key\",\"size\":$size,\"required\":$req,\"array\":$arr}"
  sleep 0.3
}

add_integer() {
  local coll="$1" key="$2" req="$3"
  echo "    + integer: $key (req=$req)"
  api POST "/databases/$DB_ID/collections/$coll/attributes/integer" \
    "{\"key\":\"$key\",\"required\":$req}"
  sleep 0.3
}

add_float() {
  local coll="$1" key="$2" req="$3"
  echo "    + float: $key (req=$req)"
  api POST "/databases/$DB_ID/collections/$coll/attributes/float" \
    "{\"key\":\"$key\",\"required\":$req}"
  sleep 0.3
}

add_boolean() {
  local coll="$1" key="$2" req="$3"
  echo "    + boolean: $key (req=$req)"
  api POST "/databases/$DB_ID/collections/$coll/attributes/boolean" \
    "{\"key\":\"$key\",\"required\":$req}"
  sleep 0.3
}

# ─── Exercises ───
echo "  [exercises]"
add_string exercises name 256 true
add_string exercises muscleGroup 64 true
add_string exercises secondaryMuscles 128 false true
add_string exercises equipment 64 true
add_string exercises difficulty 32 true
add_string exercises icon 64 false
add_string exercises instructions 8192 false

# ─── Programs ───
echo "  [programs]"
add_string programs userId 128 true
add_string programs name 256 true
add_integer programs daysPerWeek true
add_integer programs currentWeek false
add_integer programs totalWeeks false

# ─── Program Days ───
echo "  [program_days]"
add_string program_days programId 128 true
add_string program_days userId 128 true
add_string program_days name 256 true
add_integer program_days order true
add_string program_days exercises 1048576 true  # large for JSON array

# ─── Workout Sessions ───
echo "  [workout_sessions]"
add_string workout_sessions userId 128 true
add_string workout_sessions programDayId 128 false
add_string workout_sessions programDayName 256 true
add_string workout_sessions startedAt 64 true
add_string workout_sessions completedAt 64 false
add_float workout_sessions totalVolume false
add_integer workout_sessions duration false
add_string workout_sessions notes 4096 false

# ─── Workout Sets ───
echo "  [workout_sets]"
add_string workout_sets sessionId 128 true
add_string workout_sets userId 128 true
add_string workout_sets exerciseId 128 true
add_integer workout_sets setNumber true
add_float workout_sets weight true
add_integer workout_sets reps true
add_boolean workout_sets isCompleted true
add_float workout_sets rpe false

# ─── Personal Records ───
echo "  [personal_records]"
add_string personal_records userId 128 true
add_string personal_records exerciseId 128 true
add_string personal_records exerciseName 256 true
add_float personal_records weight true
add_integer personal_records reps true
add_float personal_records estimated1RM true
add_string personal_records achievedAt 64 true

# ─── Social Posts ───
echo "  [social_posts]"
add_string social_posts userId 128 true
add_string social_posts userName 256 true
add_string social_posts avatarColor 16 false
add_string social_posts sessionId 128 false
add_string social_posts text 2048 true
add_string social_posts stats 512 false
add_boolean social_posts isPR false
add_integer social_posts likes false
add_string social_posts likedBy 4096 false true

# ─── User Profiles ───
echo "  [user_profiles]"
add_string user_profiles userId 128 true
add_string user_profiles displayName 256 true
add_string user_profiles avatarColor 16 false
add_integer user_profiles streakCount false
add_string user_profiles lastWorkoutDate 64 false
add_integer user_profiles weeklyGoal false

echo ""
echo "═══════════════════════════════════════════════"
echo "  Step 4: Wait for attributes to provision..."
echo "═══════════════════════════════════════════════"
sleep 5

echo ""
echo "═══════════════════════════════════════════════"
echo "  Step 5: Add indexes"
echo "═══════════════════════════════════════════════"

add_index() {
  local coll="$1" key="$2" type="$3"
  shift 3
  local attrs="$@"
  # Build JSON array from args
  local arr_json="["
  local first=true
  for a in $attrs; do
    if [ "$first" = true ]; then first=false; else arr_json+=","; fi
    arr_json+="\"$a\""
  done
  arr_json+="]"
  
  # Build orders array (same length, all ASC)
  local ord_json="["
  first=true
  for a in $attrs; do
    if [ "$first" = true ]; then first=false; else ord_json+=","; fi
    ord_json+="\"ASC\""
  done
  ord_json+="]"
  
  echo "    🔍 index: $key ($type on $attrs)"
  api POST "/databases/$DB_ID/collections/$coll/indexes" \
    "{\"key\":\"$key\",\"type\":\"$type\",\"attributes\":$arr_json,\"orders\":$ord_json}"
  sleep 0.5
}

add_index exercises idx_name key name
add_index programs idx_userId key userId
add_index program_days idx_programId key programId
add_index program_days idx_userId key userId
add_index workout_sessions idx_userId key userId
add_index workout_sessions idx_startedAt key startedAt
add_index workout_sets idx_sessionId key sessionId
add_index workout_sets idx_exercise key userId exerciseId
add_index personal_records idx_userId key userId
add_index personal_records idx_exercise key userId exerciseId
add_index social_posts idx_createdAt key "\$createdAt"
add_index user_profiles idx_userId key userId

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ All done!"
echo "═══════════════════════════════════════════════"
