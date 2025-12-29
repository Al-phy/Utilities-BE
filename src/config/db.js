
import { Sequelize } from "sequelize";
 
const sequelize = new Sequelize("school_db", "root", "alphy@123", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
});
 
export default sequelize;
 