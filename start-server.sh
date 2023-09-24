npm run build
cd dist/asrdb-frontend

echo "**************************************************************"
echo "* Your application is built using development profile!       *"
echo "* Use this server to test your app in all locales!           *"
echo "* Navigate to localhost:9000 to check your application       *"
echo "**************************************************************"
python3 -m http.server 9000
