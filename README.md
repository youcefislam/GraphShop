# GraphShop
A simple shopping graphQL API

![Shopping class diagram](https://files.fm/thumb_show.php?i=6aefcwzpc)

## Installation
 Do the following to clone and start the project
 - Make sure you have Node and MySQL installed
 - Create .env file in the root folder and add these variabls (dont forget to change the variabls)
 ```env
 DATABASE_URL="mysql://<username>:<password>@127.0.0.1:3306/graphshop"
 APP_SECRET="Secret"
 ```
 - run the follwing commands:
 ```sh
 $ git clone https://github.com/youcefislam/GraphShop.git
 $ git cd GraphShop
 $ npm i
 $ npx prisma generate
 $ npm run dev
 ```
 - Run this statement so you can use admin account (email: mail@mail.com, psw: strongPassword)
 ```mysql
 insert into admin(email,password,role) values ("mail@mail.com","$2a$10$fiiziC1LR4qgRH3r5HYT9.9ExqjpYtoOdMpHmsBDg/vJlohcBruwC","CHIEF");
 ```

## Models
  This API has the following models:
  1. `Admin` - respresenting the admins of the system
  2. `Client` - represent the client of the system
  3. `Product` - represent the products.
  4. `Cart`- represent the client' shopping cart.
  5. `Sales history` - represent all the history of sales

## Types
  ### Query
  There are 7 fields in the root query type:
   1. `ProductList` - return list of all the products (all)
   2. `product` - return a prouct with the specified ID (all)
   3. `client` - return a client with the specified ID (admin)
   4. `clientList` - return the client list (admin)
   5. `myCart` - return the cart content of the client (client)
   6. `salesHistory` - return the list of sales history (admin)
   7. `customerPurchaces` - return purchases history of a specific client (admin)
  ### Mutation
  There are 11 fields in the root mutation type:
   1. `addProduct` - add a new product to the database (admin)
   2. `updateProduct` - update a product (admin)
   3. `removeProduct` - remove a product from the database (admin)
   4. `addToCart` - add a product to the client' shopping cart, ***if product not bought after 5 min, it got removed from the cart*** (client)
   5. `removeFromCart` - remove a product from the client' shopping cart (client)
   6. `updateCart` - update a product in the client' shopping cart (client)
   7. `clearCart` - remove all the products from the client' cart (client)
   8. `buyCart` - buy all the product in the client' cart (client)
   9. `signIn` - client sign in
   10. `signUp` - client sign up
   11. `signInAdmin` - admin sign in
 
