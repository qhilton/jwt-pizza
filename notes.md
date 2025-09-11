# Learning notes

## JWT Pizza code study and debugging

As part of `Deliverable ⓵ Development deployment: JWT Pizza`, start up the application and debug through the code until you understand how it works. During the learning process fill out the following required pieces of information in order to demonstrate that you have successfully completed the deliverable.

| User activity                                       | Frontend component | Backend endpoints | Database SQL |
| --------------------------------------------------- | ------------------ | ----------------- | ------------ |
| View home page                                      | home.tsx           | none              | none         |
| Register new user<br/>(t@jwt.com, pw: test)         | register.tsx       | [POST] /api/auth  | INSERT INTO user (name, email, password) VALUES (?, ?, ?)<br/> INSERT INTO userRole (userId, role, objectId) VALUES (?, ?, ?) |
| Login new user<br/>(t@jwt.com, pw: test)            | login.tsx          | [PUT] /api/auth   | SELECT * FROM user WHERE email=?<br/> SELECT * FROM userRole WHERE userId=? |
| Order pizza                                         | payment.tsx        | [POST] /api/order | INSERT INTO dinerOrder (dinerId, franchiseId, storeId, date) VALUES (?, ?, ?, now())<br/> INSERT INTO orderItem (orderId, menuId, description, price) VALUES (?, ?, ?, ?) |
| Verify pizza                                        | delivery.tsx       | [POST] /api/order/verify | none  |
| View profile page                                   | dinerDashboard.tsx | [GET] /api/order  |SELECT id, franchiseId, storeId, date FROM dinerOrder WHERE dinerId=? LIMIT ${offset},${config.db.listPerPage}<br/> SELECT id, menuId, description, price FROM orderItem WHERE orderId=? |
| View franchise<br/>(as diner)                       | franchiseDashboard.tsx | none          | none         |
| Logout                                              | logout.tsx         |[DELETE] /api/auth | DELETE FROM auth WHERE token=? |
| View About page                                     | about.tsx          | none              | none         |
| View History page                                   | history.tsx        | none              | none         |
| Login as franchisee<br/>(f@jwt.com, pw: franchisee) | login.tsx          | [PUT] /api/auth   | SELECT * FROM user WHERE email=?<br/> SELECT * FROM userRole WHERE userId=? |
| View franchise<br/>(as franchisee)                  | franchiseDashboard.tsx | [GET] /api/franchise/:userId | SELECT objectId FROM userRole WHERE role='franchisee' AND userId=?<br/> SELECT id, name FROM franchise WHERE id in (${franchiseIds.join(',')}) |
| Create a store                                      | createStore.tsx    | [POST] /api/franchise/:franchiseId/store | INSERT INTO store (franchiseId, name) VALUES (?, ?) |
| Close a store                                       | closeStore.tsx     | [DELETE] /api/franchise/:franchiseId/store/:storeId | SELECT u.id, u.name, u.email FROM userRole AS ur JOIN user AS u ON u.id=ur.userId WHERE ur.objectId=? AND ur.role='franchisee' |
| Login as admin<br/>(a@jwt.com, pw: admin)           | login.tsx          | [PUT] /api/auth   | DELETE FROM store WHERE franchiseId=? AND id=? |
| View Admin page                                     | adminDashboard.tsx | [GET] /api/franchise?page=0&limit=10&name=* | SELECT id, name FROM franchise WHERE name LIKE ? LIMIT ${limit + 1} OFFSET ${offset}<br/> SELECT id, name FROM store WHERE franchiseId=? |
| Create a franchise for t@jwt.com                    |                    |                   |              |
| Close the franchise for t@jwt.com                   |                    |                   |              |
