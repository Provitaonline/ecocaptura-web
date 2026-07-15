// data/checkUser.ts
export const checkUser = async (email: string) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock logic: Treat 'test@example.com' as an existing user
	const userDataRaw = localStorage.getItem('mock_db_user_' + email);
  
	if (userDataRaw) {
		const userData = JSON.parse(userDataRaw);
		return {
		exists: true,
		username: userData.username,
		email: email
		};
	}

	return { exists: false, email: email };
}