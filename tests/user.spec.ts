import { Page } from '@playwright/test';
import { test, expect } from 'playwright-test-coverage';
import { User, Role } from '../src/service/pizzaService';


async function basicInit(page: Page) {
  let loggedInUser: User | undefined;
  const validUsers: Record<string, User> = {
    'd@jwt.com': { id: '3', name: 'Kai Chen', email: 'd@jwt.com', password: 'a', roles: [{ role: Role.Diner }] },
    'a@jwt.com': { id: '4', name: 'John Smith', email: 'a@jwt.com', password: 'admin', roles: [{ role: Role.Admin }] },
    'f@jwt.com': { id: '5', name: 'Bob', email: 'f@jwt.com', password: 'franchisee', roles: [{ role: Role.Franchisee }] },
  };

  // Authorize login for the given user
  await page.route('*/**/api/auth', async (route) => {
    const req = route.request();
    if (req.method() == "DELETE") {
      const authHeader = req.headers()['authorization'];
      expect(authHeader).toBe('Bearer abcdef');

      loggedInUser = undefined;

      expect(route.request().method()).toBe('DELETE');
      await route.fulfill({
        status: 200,
        json: {},
      });
    }
    else if (req.method() == "PUT") {
      const loginReq = req.postDataJSON();
      const user = validUsers[loginReq.email];
      if (!user || user.password !== loginReq.password) {
        await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
        return;
      }
      loggedInUser = validUsers[loginReq.email];
      const loginRes = {
        user: loggedInUser,
        token: 'abcdef',
      };
      expect(route.request().method()).toBe('PUT');
      await route.fulfill({ json: loginRes });
    }
    else if (req.method() == "POST") {
			const registerReq = req.postDataJSON();
			const { name, email, password } = registerReq;

			// Check if user already exists
			if (validUsers[email]) {
				await route.fulfill({
					status: 409,
					json: { error: 'User already exists' }
				});
				return;
			}

			// Create new user
			const newUserId = String(Object.keys(validUsers).length + 6); // Start from 6 since existing users have ids 3,4,5
			const newUser: User = {
				id: newUserId,
				name: name,
				email: email,
				password: password,
				roles: [{ role: Role.Diner }]
			};

			// Add to valid users
			validUsers[email] = newUser;

			// Set as logged in user and generate token
			loggedInUser = newUser;
			// loggedInToken = 'abcdef';

			const registerRes = {
				user: {
					id: parseInt(newUserId),
					name: newUser.name,
					email: newUser.email,
					roles: newUser.roles
				},
				token: 'abcdef',
			};

			await route.fulfill({
				status: 200,
				json: registerRes
			});
    }
  });

  // Return the currently logged in user
  // await page.route('*/**/api/user/me', async (route) => {
  //   expect(route.request().method()).toBe('GET');
  //   await route.fulfill({ json: loggedInUser });
  // });

  // Update user information
	// await page.route(/\/api\/user\/\d+$/, async (route) => {
	// 	const req = route.request();

	// 	if (req.method() === 'PUT') {
	// 		const authHeader = req.headers()['authorization'];
	// 		expect(authHeader).toBe('Bearer abcdef');

	// 		const updateReq = req.postDataJSON();
	// 		const { name, email, password } = updateReq;

	// 		// Update the logged in user
	// 		if (loggedInUser) {
	// 			loggedInUser.name = name || loggedInUser.name;
	// 			loggedInUser.email = email || loggedInUser.email;
	// 			if (password) {
	// 				loggedInUser.password = password;
	// 			}

	// 			// Update in validUsers as well
	// 			// if (validUsers[loggedInUser.email]) {
	// 			// 	validUsers[loggedInUser.email] = loggedInUser;
	// 			// }
	// 		}

	// 		// Return the response format that matches the actual API
	// 		await route.fulfill({
	// 			status: 200,
	// 			json: {
	// 				user: loggedInUser,
	// 				token: 'abcdef'
	// 			}
	// 		});
	// 		return;
	// 	}

	// 	await route.fulfill({ status: 405, json: { error: 'Method Not Allowed' } });
	// });

	await page.route(/\/api\/user(\/\d+)?(\?.*)?$/, async (route) => {
		const req = route.request();
		const url = req.url();
		const method = req.method();
		
		// Check if this is a specific user endpoint (/api/user/:id)
		const userIdMatch = url.match(/\/api\/user\/(\d+)$/);
		const userId = userIdMatch ? userIdMatch[1] : null;
		
		// Handle /api/user/me (get current user)
		if (method === 'GET' && url.endsWith('/api/user/me')) {
			await route.fulfill({ json: loggedInUser });
			return;
		}
		
		// Handle GET /api/user (list users)
		if (method === 'GET' && !userId && !url.endsWith('/me')) {
			const authHeader = req.headers()['authorization'];
			expect(authHeader).toBe('Bearer abcdef');
			
			const mockUsers = Object.values(validUsers).map(user => ({
				id: parseInt(user.id ?? '0'),
				name: user.name,
				email: user.email,
				roles: user.roles
			}));
			
			await route.fulfill({
				status: 200,
				json: {
					userList: mockUsers,
					more: false
				}
			});
			return;
		}
		
		// Handle PUT /api/user/:id (update user)
		if (method === 'PUT' && userId) {
			const authHeader = req.headers()['authorization'];
			expect(authHeader).toBe('Bearer abcdef');

			const updateReq = req.postDataJSON();
			const { name, email, password } = updateReq;

			// Update the logged in user
			if (loggedInUser) {
				loggedInUser.name = name || loggedInUser.name;
				loggedInUser.email = email || loggedInUser.email;
				if (password) {
					loggedInUser.password = password;
				}
			}

			await route.fulfill({
				status: 200,
				json: {
					user: loggedInUser,
					token: 'abcdef'
				}
			});
			return;
		}
		
		// Handle DELETE /api/user/:id (delete user)
		if (method === 'DELETE' && userId) {
			const authHeader = req.headers()['authorization'];
			expect(authHeader).toBe('Bearer abcdef');
			
			// Find and remove user from validUsers
			const userToDelete = Object.values(validUsers).find(user => user.id === userId);
			if (userToDelete && userToDelete.email) {
				delete validUsers[userToDelete.email];
			}
			
			await route.fulfill({
				status: 200,
				json: { message: 'User deleted successfully' }
			});
			return;
		}
		
		// Default fallback
		await route.fulfill({ status: 405, json: { error: 'Method Not Allowed' } });
	});

  
  await page.goto('/');
}



test('updateUser', async ({ page }) => {
  await basicInit(page);
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await page.goto('/');
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('pizza diner');
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Register' }).click();

  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByRole('main')).toContainText('pizza diner');

  await page.getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('h3')).toContainText('Edit user');
  await page.getByRole('textbox').first().fill('pizza dinerx');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.waitForSelector('[role="dialog"].hidden', { state: 'attached' });

  await expect(page.getByRole('main')).toContainText('pizza dinerx');

  await page.getByRole('link', { name: 'Logout' }).click();
  await page.getByRole('link', { name: 'Login' }).click();

  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByRole('main')).toContainText('pizza dinerx');
});

test('updatePassword', async ({ page }) => {
  // await basicInit(page);
  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await page.goto('/');
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('pizza diner');
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Register' }).click();

  await page.getByRole('link', { name: 'pd' }).click();

  await page.getByRole('button', { name: 'Edit' }).click();
  await page.locator('#password').click();
  await page.locator('#password').fill('a');
  await page.getByRole('button', { name: 'Update' }).click();

  await page.getByRole('link', { name: 'Logout' }).click();

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
  await page.getByRole('textbox', { name: 'Password' }).fill('a');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'pd' }).click();

  await expect(page.getByRole('main')).toContainText('pizza diner');
});

test('listUsers', async ({ page }) => {
  await basicInit(page);
  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'Admin' }).click();
  await page.getByRole('button', { name: 'Show All Users' }).click();

  await page.getByRole('cell', { name: 'a@jwt.com' }).click();
  await page.getByRole('columnheader', { name: 'Email' }).click();

  await page.getByRole('row', { name: 'Name Email Role Action' }).getByRole('button').click();
});

test('delete user', async ({ page }) => {
  await basicInit(page);

  const email = `user${Math.floor(Math.random() * 10000)}@jwt.com`;
  await page.getByRole('link', { name: 'Register' }).click();
  await page.getByRole('textbox', { name: 'Full name' }).fill('pizza diner');
  await page.getByRole('textbox', { name: 'Email address' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill('diner');
  await page.getByRole('button', { name: 'Register' }).click();
  await page.getByRole('link', { name: 'Logout' }).click();

  await page.getByRole('link', { name: 'Login' }).click();
  await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
  await page.getByRole('textbox', { name: 'Password' }).fill('admin');
  await page.getByRole('button', { name: 'Login' }).click();

  await page.getByRole('link', { name: 'Admin' }).click();
  await page.getByRole('button', { name: 'Show All Users' }).click();

  await page.getByRole('cell', { name: 'a@jwt.com' }).click();
  await page.getByRole('columnheader', { name: 'Email' }).click();

  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole('row', { name: 'Bob f@jwt.com franchisee' }).getByRole('button').click();

  await page.getByRole('row', { name: 'Name Email Role Action' }).getByRole('button').click();
});

// test('deleteUser', async ({ page }) => {
//     await basicInit(page);
//     await page.getByRole('link', { name: 'Login' }).click();
//     await page.getByRole('textbox', { name: 'Email address' }).fill('a@jwt.com');
//     await page.getByRole('textbox', { name: 'Password' }).fill('admin');
//     await page.getByRole('button', { name: 'Login' }).click();

//     await page.getByRole('link', { name: 'Admin' }).click();
    
//     // Get initial user count
//     const initialCount = await page.getByRole('cell', { name: 'Delete' }).count();
    
//     // Listen for the dialog and accept it
//     page.on('dialog', dialog => dialog.accept());
    
//     // Click the delete button
//     //await page.getByRole('button', { name: 'Delete' }).nth(0).click();
    
//     page.once('dialog', dialog => {
//       console.log(`Dialog message: ${dialog.message()}`);
//       dialog.dismiss().catch(() => {});
//     });
    
//     // Verify the user was deleted (count should decrease)
//     let userCountAfterDeletion = await page.getByRole('cell', { name: 'Delete' }).count();
//     console.log(`User count after deletion attempt: ${userCountAfterDeletion}`);
//     await expect(page.getByRole('cell', { name: 'Delete' })).toHaveCount(initialCount - 1);
// });