# asrdb-frontend
Dashboard and client for asrdb

**Requirements**
1. Run ```npm install``` to install all dependencies.

**Run the application**

1. Run ```npm run start``` to run the application in development mode.
   - This will also make the application reachable in you local internet. You can access it from you mobile phone or other devices by going to ```local_ip:4200```.
   - You can find the ```local_ip``` of the device which is serving the application by going to the internet settings of the device.
2. Go to ```localhost:4200``` to view the application.
3. The application will be running in development mode and would be using environment variables from the ```src/environments/environment.development.ts``` file.
   - You can also start a small backend dev-server ```node simple-backend-server.js```.
   - This provides a simple implementation for the endpoints in order to use the frontend.
4. To run the application in production mode run ```npm run start-prod```.

**Build the application**
1. To build the application using development profile run ```npm run build```.
2. To run the application using the production profile run ```npm run build-prod```.
3. You can also preview the built application by serving the content of ```dist/asrdb-frontend``` using a simple server.
   - One option would be to run ```python3 -m http.server 9000``` to serve the application using a simple http server offerd by python3
   - You can also execute the ```start-server.sh``` script which will:
     - build the app in development mode
     - serve the app using the python3 http server
