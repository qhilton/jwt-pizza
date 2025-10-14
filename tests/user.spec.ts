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
      const regReq = req.postDataJSON();
      const { name, email, password } = regReq;

      // if (!name || !email || !password) {
      //   await route.fulfill({ status: 400, json: { message: 'name, email, and password are required' } });
      //   return;
      // }

      // if (validUsers[email]) {
      //   await route.fulfill({ status: 409, json: { message: 'User already exists' } });
      //   return;
      // }

      const newUser = {
        id: 5,
        name: name,
        email: email,
        password: password,
        role: [{ role: Role.Diner }]
      };
      
      // loggedInUser = newUser;
      const regRes = {
        user: newUser,
        token: 'abcdef',
      };
      expect(route.request().method()).toBe('POST');
      await route.fulfill({ status: 200, json: regRes });
    }
  });

  // Return the currently logged in user
  await page.route('*/**/api/user/me', async (route) => {
    expect(route.request().method()).toBe('GET');
    await route.fulfill({ json: loggedInUser });
  });

  // A standard menu
  await page.route('*/**/api/order/menu', async (route) => {
    const req = route.request();
    const method = req.method();

    if (method == "GET") {
      const menuRes = [
        {
          id: 1,
          title: 'Veggie',
          image: 'pizza1.png',
          price: 0.0038,
          description: 'A garden of delight',
        },
        {
          id: 2,
          title: 'Pepperoni',
          image: 'pizza2.png',
          price: 0.0042,
          description: 'Spicy treat',
        },
      ];
      expect(route.request().method()).toBe('GET');
      await route.fulfill({ json: menuRes });
    }
    else if (method == "PUT") {
      const authHeader = req.headers()['authorization'];
      expect(authHeader).toBe('Bearer abcdef');

      const newReq = req.postDataJSON();
      const { title, image, price, description } = newReq;
      const newItem = {
        id: 3,
        title: title,
        image: image,
        price: price,
        description: description,
      };

      expect(route.request().method()).toBe('PUT');
      await route.fulfill({
        status: 200,
        json: [newItem],
      });
    }
  });

  await page.route(/\/api\/franchise(\/\d+)?$/, async (route) => {
    const req = route.request();
    const method = req.method();

    if (method == "DELETE") {
      const authHeader = req.headers()['authorization'];
      expect(authHeader).toBe('Bearer abcdef');

      expect(route.request().method()).toBe('DELETE');
      await route.fulfill({
        status: 200,
        json: {},
      });
    }

    else if (method == "GET") {
      const authHeader = req.headers()['authorization'];
      expect(authHeader).toBe('Bearer abcdef');

      const match = req.url().match(/\/api\/franchise\/(\d+)/);
      const userId = match ? match[1] : undefined;

      if (userId == '5') {
        const franchiseRes = [{
          id: 1,
          name: 'LotaPizza',
          admins: {
            id: '5',
            name: 'Bob',
            email: 'f@jwt.com'
          },
          stores: [
            { id: 4, name: 'Lehi', totalRevenue: 0 },
            { id: 5, name: 'Springville', totalRevenue: 0 },
            { id: 6, name: 'American Fork', totalRevenue: 0 },
          ],
        }];

        expect(route.request().method()).toBe('GET');
        await route.fulfill({
          status: 200,
          json: franchiseRes,
        });
        return;
      }
    }
  });

  // Standard franchises and stores
  await page.route(/\/api\/franchise(\?.*)?$/, async (route) => {
    const req = route.request();
    const method = req.method();

    if (method == "GET") {
      const franchiseRes = {
        franchises: [
          {
            id: 2,
            name: 'LotaPizza',
            stores: [
              { id: 4, name: 'Lehi' },
              { id: 5, name: 'Springville' },
              { id: 6, name: 'American Fork' },
            ],
          },
          { id: 3, name: 'PizzaCorp', stores: [{ id: 7, name: 'Spanish Fork' }] },
          { id: 4, name: 'topSpot', stores: [] },
        ],
      };
      expect(route.request().method()).toBe('GET');
      await route.fulfill({ json: franchiseRes });
    }
    
  });

  

  // Order a pizza.
  await page.route('*/**/api/order', async (route) => {
    const req = route.request();
    const method = req.method();

    if (method == "POST") {
      const orderReq = route.request().postDataJSON();
      const orderRes = {
        order: { ...orderReq, id: 23 },
        jwt: 'eyJpYXQ',
      };
      expect(route.request().method()).toBe('POST');
      await route.fulfill({ json: orderRes });
    }
    else if (method == "GET") {
      const url = new URL(req.url());
      const pageParam = url.searchParams.get('page') || '1';

      const mockOrders = [
        {
          id: 1,
          item: 'Pepperoni',
          quantity: 2,
          createdAt: '2023-10-01T12:00:00Z',
        },
        {
          id: 2,
          item: 'Crusty',
          quantity: 1,
          createdAt: '2023-10-02T14:00:00Z',
        }
      ];

      const paginated = {
        page: parseInt(pageParam),
        totalPages: 1,
        orders: mockOrders,
      };

      expect(method).toBe('GET');

      await route.fulfill({
        status: 200,
        json: paginated,
      });
    }
    
  });

  await page.route('*/**/api/franchise', async (route) => {
    const req = route.request();
    const method = req.method();

    if (method == "POST") {
      const authHeader = req.headers()['authorization'];
      expect(authHeader).toBe('Bearer abcdef');

      const newReq = req.postDataJSON();
      const { name, email } = newReq;

      const newFranchisee = {
        name: name,
        email: email,
      }

      expect(method).toBe('POST');
      await route.fulfill({
        status: 200,
        json: newFranchisee,
      });
    }
  
  });


  await page.route('*/**/api/franchise/:franchiseId/store', async (route) => {
    const req = route.request();
    const method = req.method();

    if (method == "POST") {
      const authHeader = req.headers()['authorization'];
      expect(authHeader).toBe('Bearer abcdef');

      const newReq = req.postDataJSON();

      const newStore = {
        name: newReq.name,
      }

      expect(method).toBe('POST');
      await route.fulfill({
        status: 200,
        json: newStore,
      });
    }
  });

  await page.route('*/**/api/franchise/:franchiseId/store/:storeId', async (route) => {
    const req = route.request();
    const method = req.method();

    if (method == "DELETE") {
      const authHeader = req.headers()['authorization'];
      expect(authHeader).toBe('Bearer abcdef');

      expect(route.request().method()).toBe('DELETE');
      await route.fulfill({
        status: 200,
        json: {},
      });
    }
  });

  await page.goto('/');
}



test('updateUser', async ({ page }) => {
  // await basicInit(page);
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