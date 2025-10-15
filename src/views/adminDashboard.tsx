import React from 'react';
import View from './view';
import { useNavigate } from 'react-router-dom';
import NotFound from './notFound';
import Button from '../components/button';
import { pizzaService } from '../service/service';
import { Franchise, FranchiseList, Role, Store, User, UserList } from '../service/pizzaService';
import { CloseIcon, TrashIcon } from '../icons';
import { HSOverlay } from 'preline';

interface Props {
  user: User | null;
}

export default function AdminDashboard(props: Props) {
  const navigate = useNavigate();
  const [franchiseList, setFranchiseList] = React.useState<FranchiseList>({ franchises: [], more: false });
  const [franchisePage, setFranchisePage] = React.useState(0);
  const filterFranchiseRef = React.useRef<HTMLInputElement>(null);

  const [userList, setUserList] = React.useState<UserList>({ userList: [], more: false });
  const [usersPage, setUsersPage] = React.useState(0);
  const filterUsersRef = React.useRef<HTMLInputElement>(null);

  const userListModalRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    (async () => {
      setFranchiseList(await pizzaService.getFranchises(franchisePage, 3, '*'));
    })();
  }, [props.user, franchisePage]);

  React.useEffect(() => {
    (async () => {
      setUserList(await pizzaService.getUsers(usersPage, 10, '*'));
    })();
  }, [props.user, usersPage]);

  function createFranchise() {
    navigate('/admin-dashboard/create-franchise');
  }

  async function closeFranchise(franchise: Franchise) {
    navigate('/admin-dashboard/close-franchise', { state: { franchise: franchise } });
  }

  async function closeStore(franchise: Franchise, store: Store) {
    navigate('/admin-dashboard/close-store', { state: { franchise: franchise, store: store } });
  }

  async function filterFranchises() {
    setFranchiseList(await pizzaService.getFranchises(franchisePage, 10, `*${filterFranchiseRef.current?.value}*`));
  }

  async function filterUsers() {
    setUserList(await pizzaService.getUsers(usersPage, 10, `*${filterUsersRef.current?.value}*`));
    // setTimeout(() => {
    //   HSOverlay.close(document.getElementById('hs-user-list-modal')!);
    // }, 100);
  }

  async function deleteUser(userId: number) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        // await pizzaService.deleteUser(userId);
        setUserList(await pizzaService.getUsers(usersPage, 10, '*'));
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user. Please try again.');
      }
    }
  }

  console.log(document.getElementById('hs-user-list-modal'));

  console.log('props.user:', props.user);
console.log('is admin?', Role.isRole(props.user, Role.Admin));

  let response = <NotFound />;
  if (Role.isRole(props.user, Role.Admin)) {
    response = (
      <View title="Mama Ricci's kitchen">
        <div className="text-start py-8 px-4 sm:px-6 lg:px-8">
          <h3 className="text-neutral-100 text-xl">Franchises</h3>
          <div className="bg-neutral-100 overflow-clip my-4">
            <div className="flex flex-col">
              <div className="-m-1.5 overflow-x-auto">
                <div className="p-1.5 min-w-full inline-block align-middle">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="uppercase text-neutral-100 bg-slate-400 border-b-2 border-gray-500">
                        <tr>
                          {['Franchise', 'Franchisee', 'Store', 'Revenue', 'Action'].map((header) => (
                            <th key={header} scope="col" className="px-6 py-3 text-center text-xs font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      {franchiseList.franchises.map((franchise, findex) => {
                        return (
                          <tbody key={findex} className="divide-y divide-gray-200">
                            <tr className="border-neutral-500 border-t-2">
                              <td className="text-start px-2 whitespace-nowrap text-l font-mono text-orange-600">{franchise.name}</td>
                              <td className="text-start px-2 whitespace-nowrap text-sm font-normal text-gray-800" colSpan={3}>
                                {franchise.admins?.map((o) => o.name).join(', ')}
                              </td>
                              <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                                <button type="button" className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400  hover:border-orange-800 hover:text-orange-800" onClick={() => closeFranchise(franchise)}>
                                  <TrashIcon />
                                  Close
                                </button>
                              </td>
                            </tr>

                            {franchise.stores.map((store, sindex) => {
                              return (
                                <tr key={sindex} className="bg-neutral-100">
                                  <td className="text-end px-2 whitespace-nowrap text-sm text-gray-800" colSpan={3}>
                                    {store.name}
                                  </td>
                                  <td className="text-end px-2 whitespace-nowrap text-sm text-gray-800">{store.totalRevenue?.toLocaleString()} ₿</td>
                                  <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                                    <button type="button" className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800" onClick={() => closeStore(franchise, store)}>
                                      <TrashIcon />
                                      Close
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        );
                      })}
                      <tfoot>
                        <tr>
                          <td className="px-1 py-1">
                            <input type="text" ref={filterFranchiseRef} name="filterFranchise" placeholder="Filter franchises" className="px-2 py-1 text-sm border border-gray-300 rounded-lg" />
                            <button type="submit" className="ml-2 px-2 py-1 text-sm font-semibold rounded-lg border border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800" onClick={filterFranchises}>
                              Submit
                            </button>
                          </td>
                          <td colSpan={4} className="text-end text-sm font-medium">
                            <button className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300 " onClick={() => setFranchisePage(franchisePage - 1)} disabled={franchisePage <= 0}>
                              «
                            </button>
                            <button className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300" onClick={() => setFranchisePage(franchisePage + 1)} disabled={!franchiseList.more}>
                              »
                            </button>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between">
          <Button className="w-36 text-xs sm:text-sm sm:w-64" title="Add Franchise" onPress={createFranchise} />
          <Button title="Show All Users" className="w-16 p-0" onPress={() => HSOverlay.open(document.getElementById('hs-user-list-modal')!)} />
        </div>

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          id="hs-user-list-modal"
          className="hs-overlay hidden size-full fixed top-10 start-0 z-[80] overflow-x-hidden overflow-y-auto pointer-events-none"
        >
          <div className="hs-overlay-open:mt-7 hs-overlay-open:opacity-100 hs-overlay-open:duration-500 mt-0 opacity-0 ease-out transition-all sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-3.5rem)]">
            <div className="bg-white rounded-xl shadow-lg pointer-events-auto">
              <div className="bg-neutral-100 overflow-clip my-4">
                <div className="flex flex-col">
                  <div className="-m-1.5 overflow-x-auto">
                    <div className="p-1.5 min-w-full inline-block align-middle">
                      <div className="overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="uppercase text-neutral-100 bg-slate-400 border-b-2 border-gray-500">
                            <tr>
                              {['Name', 'Email', 'Role', 'Action'].map((header) => (
                                <th key={header} scope="col" className="px-6 py-3 text-center text-xs font-medium">
                                  {header}
                                </th>
                              ))}
                              <button type="button" className="flex justify-center items-center size-7 text-sm font-semibold rounded-full border border-transparent text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:pointer-events-none" data-hs-overlay="#hs-user-list-modal">
                                <CloseIcon className="" />
                              </button>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {userList.userList.map((user, index) => (
                              <tr key={index} className="bg-neutral-100">
                                <td className="text-start px-2 whitespace-nowrap text-sm text-gray-800">{user.name}</td>
                                <td className="text-start px-2 whitespace-nowrap text-sm text-gray-800">{user.email}</td>
                                <td className="text-start px-2 whitespace-nowrap text-sm text-gray-800">
                                  {user.roles?.map(role => role.role).join(', ')}
                                </td>
                                <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                                  <button 
                                    type="button" 
                                    className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border
                                      border-1 border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800"
                                    onClick={() => user.id !== undefined && deleteUser(Number(user.id))}
                                  >
                                    <TrashIcon />
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td className="px-1 py-1">
                                <input
                                  type="text"
                                  ref={filterUsersRef}
                                  name="filterUsers"
                                  placeholder="Filter users"
                                  className="px-2 py-1 text-sm border border-gray-300 rounded-lg"
                                />
                                <button
                                  type="submit"
                                  className="ml-2 px-2 py-1 text-sm font-semibold rounded-lg border border-orange-400 text-orange-400
                                    hover:border-orange-800 hover:text-orange-800"
                                  onClick={filterUsers}
                                >
                                  Submit
                                </button>
                              </td>
                              <td colSpan={3} className="text-end text-sm font-medium">
                                <button
                                  className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey
                                    border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300"
                                  onClick={() => setUsersPage(usersPage - 1)}
                                  disabled={usersPage <= 0}
                                >
                                  «
                                </button>
                                <button
                                  className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey
                                    border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300"
                                  onClick={() => setUsersPage(usersPage + 1)}
                                  disabled={!userList.more}
                                >
                                  »
                                </button>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </View>
    );
  }

  console.log("modal", document.getElementById('hs-user-list-modal'));


  return response;
}
