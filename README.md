# Super-Steps

אפליקציית מעקב צעדים חברתית בזמן אמת (Expo SDK 54, React Native).
צעדים אוטומטיים דרך חיישני המכשיר, מפה עם מיקומי חברים חיים,
גילוי חברים בקרבה (סגנון Bump), וטבלת דירוג יומית/שבועית/כללית.

## מה כלול
- ספירת צעדים בזמן אמת (expo-sensors: Pedometer באנדרואיד, Accelerometer ב-iOS)
- רענון אצווה כל 30 שניות (חסכון בסוללה) + המשכיות ברקע (expo-task-manager)
- מפת react-native-maps עם סמני חברים ותג צעדים
- גילוי חברים בקרבה (haversine < 150 מ') + בקשות חברות
- טבלת דירוג (daily / weekly / all-time)
- מסך פרופיל עם גרף היסטוריית צעדים + מצב כהה/בהיר
- התראות מקומיות על אבני דרך ובקשות חברות
- תמיכה באופליין (Firestore offline persistence)
- iOS + Android

## התקנה והרצה
```
cd super-steps
npm install
npx expo start
```
סרוק את קוד ה-QR עם Expo Go (או פתח ב-Simulator/Emulator).

## הגדרת Firebase (נדרש — אין שרת אחר)
1. צור פרויקט חדש ב-https://console.firebase.google.com
2. Build → Firestore Database → Create database (במצב test לפיתוח)
3. Build → Authentication → Sign-in method → הפעל "Email/Password"
4. Project Settings → Leaders → כפתור ה-Web (</>) → העתק את אובייקט ה-config
5. הדבק את הערכים ב-`firebaseConfig.js` (במקום YOUR_...)
6. העתק את הכללים מהסעיף "Firestore Rules" למטה אל Firestore → Rules → Publish
7. ל-Android: הוסף Google Maps API key ב-`app.json` תחת android.config.googleMaps.apiKey
   (iOS משתמש ב-Apple Maps ולא דורש מפתח)

## Firestore Rules (לפיתוח)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /steps/{id} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    match /friends/{id} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## מבנה
```
super-steps/
├─ App.js                # שורש: AuthProvider + טאבים + כתיבת מיקום
├─ app.json             # הגדרות Expo + הרשאות iOS/Android
├─ package.json
├─ firebaseConfig.js    # << הדבק כאן את מפתחות Firebase
├─ firebase.js          # אתחול Firebase (client-side, בלי שרת)
├─ AuthContext.js       # התחברות/הרשמה + פרופיל
├─ stepEngine.js       # ספירת צעדים (Pedometer/Accelerometer) + batching
├─ stepTask.js         # משימה ברקע (expo-task-manager)
├─ notifications.js     # התראות מקומיות
├─ theme.js / utils.js / components.js
└─ screens/
   ├─ AuthScreen.js
   ├─ HomeScreen.js     # מונה צעדים + מפה
   ├─ LeaderboardScreen.js
   ├─ FriendsScreen.js  # גילוי + בקשות
   └─ ProfileScreen.js  # היסטוריה + ערכת נושא
```

## הערות
- ספירת הצעדים ב-iOS מתבססת על Accelerometer (אומדן תנועה) כי Expo ללא
  dev-build לא חושף ישירות את ה-Pedometer של HealthKit. באנדרואיד משתמשים
  ב-Pedometer המדויק. לדיוק מלא ב-iOS צריך dev-build עם תוספת HealthKit.
- הקובץ מקומפל במלואו (בדיקת Babel עברה על כל הקבצים).
