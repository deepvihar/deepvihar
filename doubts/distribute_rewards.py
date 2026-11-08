import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1.base_query import FieldFilter
import datetime

cred = credentials.Certificate("firebase-key.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)
db = firestore.client()

def get_sunday_id():
    d = datetime.date.today()
    return f"{d.year}-{d.month}-{d.day}"

def distribute_weekly_prizes():
    today_id = get_sunday_id()
    print(f"Distributing prizes for Sunday: {today_id}")
    
    # Fetch all results for today and sort by score (desc) and timeTaken (asc)
    results_ref = db.collection("quiz_results").where(filter=FieldFilter("date", "==", today_id)).get()
    
    players = []
    for doc in results_ref:
        players.append(doc.to_dict())
        
    if not players:
        print("No players found for today's quiz.")
        return

    # Sort: highest score first, if tie then lowest timeTaken first
    players.sort(key=lambda x: (-x['score'], x['timeTaken']))
    
    # Remove last week's badges from users collection first
    all_users = db.collection("users").get()
    for u_doc in all_users:
        u_data = u_doc.to_dict()
        if u_data and u_data.get("isSundayChampion"):
            db.collection("users").document(u_doc.id).update({
                "isSundayChampion": False,
                "championBadge": ""
            })

    # Distribute Prizes to Top 3
    prizes = [
        (0, 50, "Sunday Champion 🥇"),
        (1, 30, "Sunday Runner-Up 🥈"),
        (2, 10, "Sunday Achiever 🥉")
    ]
    
    for index, extra_coins, badge_title in prizes:
        if index < len(players):
            winner = players[index]
            uid = winner['uid']
            
            # Update winner's coins and badge flag
            user_ref = db.collection("users").document(uid)
            user_ref.update({
                "dvCoins": firestore.Increment(extra_coins),
                "isSundayChampion": True,
                "championBadge": badge_title
            })

    print("Top 3 prizes and badges distributed successfully!")

if __name__ == "__main__":
    distribute_weekly_prizes()