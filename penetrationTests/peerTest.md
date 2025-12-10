# Penetration Test Report — JWT Pizza

## Authors
- **Quintin Hilton** 
- **Ethan Hilton** 

---

## 1. Self Attack

### 1.1 Quintin Hilton — Self Attack Records

#### Attack 1
| Item | Result |
|------|--------|
| **Date** | December 9, 2025 |
| **Target** | https://pizza-service.recipebook260.click/api/franchise/1 |
| **Classification** | Broken Access Control |
| **Severity** | 3 |
| **Description** | Discovered that the franchise deletion endpoint could be executed without authentication. Using the curl command `curl -X DELETE 'https://pizza-service.recipebook260.click/api/franchise/1'`, the request successfully deleted a franchise without requiring any credentials or elevated permissions. This allowed unauthorized deletion of critical data. |
| **Corrections** | Implemented authentication and authorization checks on the DELETE `/api/franchise/:id` endpoint, restricting access to admin users only. |

#### Attack 2
| Item | Result |
|------|--------|
| **Date** | December 9, 2025 |
| **Target** | https://pizza-service.recipebook260.click/api/franchise/1 |
| **Classification** | Broken Access Control |
| **Severity** | 3 |
| **Description** | Discovered that the order endpoint could be executed with a different price than listed. Using the curl command `curl -X POST https://pizza-service.recipebook260.click/api/order -H 'Content-Type: application/json' -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IuW4uOeUqOWQjeWtlyIsImVtYWlsIjoiYUBqd3QuY29tIiwicm9sZXMiOlt7InJvbGUiOiJhZG1pbiJ9XSwiaWF0IjoxNzY1MzI2MDc3fQ.V6OdFPA_tgMrP2Ht0Vu_gHv1UvSJSgzrYbkQiTtLHM8' -d '{"franchiseId": 1, "storeId": 1, "items":[{ "menuId": 1, "description": "Veggie", "price": 0.0001 }]}'`, the request successfully purchased pizza for any price without validating the requested price. |
| **Corrections** | Implemented validation checks on the POST `/api/order` endpoint, comparing the requested price to the actual price. |

#### Attack 3
| Item | Result |
|------|--------|
| **Date** | December 9, 2025 |
| **Target** | JWT Pizza frontend application |
| **Classification** | Insecure Design |
| **Severity** | 2 |
| **Description** | Observed that the application stores the authentication token (JWT) in `localStorage`. This storage mechanism is vulnerable to token theft if an attacker exploits an XSS vulnerability, as JavaScript-accessible storage allows malicious scripts to read and exfiltrate the token. This increases the risk of account impersonation. |
| **Corrections** | No corrections were made at this time. |

---

### 1.2 Ethan Hilton — Self Attack Records

#### Attack 1
| Item | Result |
|------|--------|
| **Date** | 2025-12-09 |
| **Target** | https://pizza-service.peachfromtheirs.click/api/auth (PUT) |
| **Classification** | Broken Authentication |
| **Severity** | 3 |
| **Description** | The authentication endpoint returned a valid admin session and JWT when called with default admin credentials and also accepted requests missing a password. This allowed an attacker to obtain an admin token without proper authentication. |
| **Corrections** | Change default credentials, reject requests missing credentials, enforce full password validation, add rate limiting and logging, and rotate any tokens issued during testing. |

---

#### Attack 2
| Item | Result |
|------|--------|
| **Date** | 2025-12-09 |
| **Target** | https://pizza-service.peachfromtheirs.click/api/auth/register (POST) |
| **Classification** | Mass-Assignment / Privilege Escalation |
| **Severity** | 2 |
| **Description** | The public registration endpoint accepted client-supplied `roles` fields. A new account could be created with elevated privileges (including admin), granting unauthorized access and admin token acquisition. |
| **Corrections** | Ignore roles provided during public registration, require admin-only workflow for privileged roles, and implement server-side validation and audit logging for account creation. |

---

#### Attack 3
| Item | Result |
|------|--------|
| **Date** | 2025-12-09 |
| **Target** | https://pizza-service.peachfromtheirs.click/api/franchise/1 (DELETE) |
| **Classification** | Broken Access Control / IDOR |
| **Severity** | 4 |
| **Description** | The DELETE franchise endpoint allowed an unauthenticated request to delete a franchise record. This enabled destructive modification of data without any authentication or authorization checks. |
| **Corrections** | Require authentication middleware and admin-role authorization for destructive endpoints, add audit logging, implement soft-delete or confirmation safeguards, and restore deleted data from backup if possible. |

---

## 2. Peer Attack

### 2.1 Quintin Hilton Attack on Ethan Hilton

#### Attack 1
| Item | Result |
|------|--------|
| **Date** | December 9, 2025 |
| **Target** | Ethan's Authentication Endpoint |
| **Classification** | Security Misconfiguration |
| **Severity** | 0 |
| **Description** | Ethan’s deployment does not use the default admin credentials. I was unable to successfully log in as an admin, gaining full administrative access to the system and all protected functionality. The attack was unsuccessful. |
| **Corrections** | None |

---

#### Attack 2
| Item | Result |
|------|--------|
| **Date** | December 9, 2025 |
| **Target** | Ethan's Order Endpoint |
| **Classification** | Broken Access Control / Insecure Direct Object Manipulation |
| **Severity** | 2 |
| **Description** | By modifying the request payload, I was able to submit an order with arbitrary pricing. The system did not validate price server-side, allowing unauthorized modification of sensitive business logic. The attack succeeded. |
| **Corrections** | Validate all price and order values server-side, ignore client-supplied monetary fields, and enforce server-calculated totals. |

---

#### Attack 3
| Item | Result |
|------|--------|
| **Date** | December 9, 2025 |
| **Target** | Ethan's Franchise Deletion Endpoint |
| **Classification** | Broken Access Control (Attempted) |
| **Severity** | 0 |
| **Description** | Attempted to delete a franchise record without admin privileges. The request was rejected, indicating that proper authorization was enforced. The attack was unsuccessful. |
| **Corrections** | None required — access control appeared to be functioning correctly. |

---

### 2.2 Ethan Hilton Attack on Quintin Hilton

Attack 1
| Item | Result |
| --- | --- |
| Date | 2025-12-10 |
| Target | https://pizza-service.recipebook260.click/ — PUT /api/user/:userId |
| Classification | Injection (SQLi) / CWE-89 |
| Severity | 0 — Unsuccessful |
| Description | Attempted to inject a bcrypt hash into user.password via DB.updateUser (vulnerable SQL: UPDATE user SET ${params.join(', ')} WHERE id=${userId}). JSON quoting issues and server parse errors prevented reliable execution; an earlier run returned a post-update 404 from getUser() (not proof of update). |
| Corrections | Parameterize DB.updateUser (prepared statements); use safe JSON serialization when testing; run exploits only on disposable local/staging DBs. |

Attack 2
| Item | Result |
| --- | --- |
| Date | 2025-12-10 |
| Target | https://pizza-service.recipebook260.click/ — PUT /api/auth |
| Classification | Broken Authentication / Insecure Design |
| Severity | 0 — Unsuccessful |
| Description | Sent login request without password to test for lenient auth. Request rejected in this run (HTTP 4xx). |
| Corrections | Enforce strict validation for auth (require email + password); add rate limiting and logging; remove/secure default admin creds. |

---

## 3. Combined Summary of Learnings

We learned that you should change the default credentials, sanatize all user inputs, require authorization for (almost) every endpoint, and ensure endpoints fail with incorrect parameters. Failing to do so leads to some fairly vital security issues.
