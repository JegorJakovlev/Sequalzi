const fs = require('fs');

const sequelize = require('./config/database');


const Book = require('./models/book');
const Author = require('./models/author');
const Category = require('./models/category');


const jsonDataPath = './books.json';


Book.belongsToMany(Author, { through: 'BookAuthor', timestamps: false });
Book.belongsToMany(Category, { through: 'BookCategory', timestamps: false });
Author.belongsToMany(Book, { through: 'BookAuthor', timestamps: false });
Category.belongsToMany(Book, { through: 'BookCategory', timestamps: false });


  sequelize.sync()
  .then(async () => {

    fs.readFile(jsonDataPath, 'utf8', async (err, data) => {
      if (err) {
        console.error('Ошибка при чтении JSON:', err);
        return;
      }
      const jsonData = JSON.parse(data);
      try {

            const booksData = jsonData.map((item) => {
            const { authors, categories, ...bookData } = item;
            return bookData;
        });

          
          const authorsData = [...new Set(jsonData.flatMap((item) => item.authors))];
          const categoriesData = [...new Set(jsonData.flatMap((item) => item.categories))];
        
          
        
          await Book.bulkCreate(booksData);
        
          await Author.bulkCreate(authorsData.map((name) => ({ name })));
          await Category.bulkCreate(categoriesData.map((name) => ({ name })));


          for (const item of jsonData) {


          const book = await Book.findOne({ where: { title: item.title } });
          const bookAuthors = await Author.findAll({ where: { name: item.authors } });
          const bookCategories = await Category.findAll({ where: { name: item.categories } });

    
          await book.setAuthors(bookAuthors);
          await book.setCategories(bookCategories);
        }

        console.log('Данные добавлены!');
      } catch (error) {
        console.error('Ошибка при добавлении данных:', error);
      } finally {

        await sequelize.close();
      }
    });
  })
  .catch((error) => {
    console.error('Ошибка при синхронизации:', error);
  });
