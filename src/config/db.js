
import { Sequelize } from "sequelize";
 
const sequelize = new Sequelize("utils", "root", "alphy@123", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
});
 
export default sequelize;
 