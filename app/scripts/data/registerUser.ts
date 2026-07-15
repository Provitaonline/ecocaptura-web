// data/registerUser.ts
export const registerUser = async (email: string, username: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock saving to "database"
  localStorage.setItem('mock_db_user_' + email, JSON.stringify({ username }));
  
  return { success: true };
}