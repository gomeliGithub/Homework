import { DataTypes, Model } from 'sequelize';

export default async function defineModels (sequelize) {
    class Client extends Model {}

    Client.init({
        login: {
            type: DataTypes.STRING,
            allowNull: false,
            autoIncrement: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    },  {
        sequelize,
        modelName: 'Client'
    });

    return { Client };
}