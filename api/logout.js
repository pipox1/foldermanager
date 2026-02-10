module.exports = async (req, res) => {
  res.setHeader('Set-Cookie', [
    'user_id=; Path=/; HttpOnly; Max-Age=0',
    'user_name=; Path=/; Max-Age=0'
  ]);
  
  res.writeHead(302, { Location: '/' });
  res.end();
};
