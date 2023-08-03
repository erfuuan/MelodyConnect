import functions from '../library/functions';
import Service from '../service/index';
import Model from '../models/index';
import responseBuilder from '../library/responseBuilder';
import CRYPTOGRAPHY from './../library/cryptography';
import chalk from 'chalk';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
export default {
  createData: async (req: Request, res: Response) => {
    try {
      const user = await Model.User.create({
        name: 'erfan',
        username: 'erfuuan',
        mobile: '09305087411',
        email: 'erfan.at799@gmail.com',
        password: '12345678',
        gender: 'male',
        role: 'admin',
      });
      res.status(201).send(user);
    } catch (err) {
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      console.log(chalk.red(err));
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      return responseBuilder.internalErr(res);
    }
  },

  Signup: async (req: Request, res: Response) => {
    try {
      const userExist = await Service.CRUD.findOneRecord(
        'User',
        {
          mobile: req.body.mobile,
          email: req.body.email,
          role: 'user',
          softDelete: false,
        },
        []
      );
      if (userExist) {
        const user = {
          mobile: userExist.mobile ? userExist.mobile : undefined,
          email: userExist.email == req.body.email ? userExist.email : undefined,
        };
        return responseBuilder.conflict(res, user, '.کاربری با این مشحصات وارده در سیستم وجود دارد ');
      }
      const user = await Service.CRUD.create('User', {
        uuid: uuidv4().replace(/-/g, ''),
        name: req.body.name,
        password: CRYPTOGRAPHY.md5(req.body.password),
        email: req.body.email,
        mobile: req.body.mobile,
        username: req.body.username,
        role: 'user',
      });
      await functions.recordActivity(user._id, '/auth/userSignup', req.body);
      return responseBuilder.success(
        res,
        {
          token: CRYPTOGRAPHY.generateAccessToken({ username: user._id }),
          name: user.name,
          username: user.username,
          role: user.role,
        },
        'حساب کاربری شما با موفقیت ایجاد شد'
      );
    } catch (err) {
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      console.log(chalk.red(err));
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      return responseBuilder.internalErr(res);
    }
  },

  Login: async (req: Request, res: Response) => {
    if (!req.body.email && !req.body.mobile) {
      return responseBuilder.badRequest(res, '', 'ارسال شماره موبایل یا آدرس ایمیل ضرروی است');
    }
    if (!req.body.password) {
      return responseBuilder.badRequest(res, '', 'ارسال رمز عبور ضرروی است');
    }
    try {
      const userData = {
        email: req.body.email ? req.body.email : undefined,
        mobile: req.body.mobile ? req.body.mobile : undefined,
        password: await CRYPTOGRAPHY.md5(req.body.password),
        softDelete: false,
      };
      const user = await Service.CRUD.findOneRecord('User', userData, []);
      if (user) {
        if (!user.active) {
          return responseBuilder.notFound(res, '', 'کاربر در سیستم غیر فعال شده است لطفا با پشتیبانی تماس بگیرید');
        }
        await functions.recordActivity(user._id, '/auth/Login', req.body);
        await Service.REDIS.put(user._id, CRYPTOGRAPHY.base64.encode(JSON.stringify(user)));
        const responseData = {
          token: CRYPTOGRAPHY.generateAccessToken({ username: user._id }),
          name: user.name,
          username: user.username,
          role: user.role,
        };
        return responseBuilder.success(res, responseData, '');
      } else {
        return responseBuilder.notFound(res, '', 'کاربری با این مشخصات در سبستم وجود ندارد');
      }
    } catch (err) {
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      console.log(chalk.red(err));
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      return responseBuilder.internalErr(res);
    }
  },

  //login with mibile and activationCode
  Entrance: async (req: Request, res: Response) => {
    try {
      const user = await Service.CRUD.findOneRecord('User', { mobile: req.body.mobile, softDelete: false }, []);
      if (user) {
        if (user.activationCode != req.body.activationCode) {
          return responseBuilder.badRequest(res, '', ' شماره موبایل یا کد ارسالی اشتباه است');
        }
        if (!user.active) {
          return responseBuilder.notFound(res, '', 'کاربر در سیستم غیر فعال شده است لطفا با پشتیبانی تماس بگیرید');
        }
        await Service.CRUD.updateById('User', { activationCode: '' }, user._id, [], '');
        await Service.REDIS.put(user._id, CRYPTOGRAPHY.base64.encode(JSON.stringify({ user: user })));
        await functions.recordActivity(user._id, '/auth/userEntrance', req.body);
        return responseBuilder.success(
          res,
          {
            token: CRYPTOGRAPHY.generateAccessToken({ username: user._id }),
            name: user.name,
            username: user.username,
            role: user.role,
          },
          ''
        );
      } else {
        return responseBuilder.notFound(res, '', 'کاربری با این شماره موبایل در سبستم وجود ندارد');
      }
    } catch (err) {
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      console.log(chalk.red(err));
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      return responseBuilder.internalErr(res);
    }
  },

  ResetPassword: async (req: Request, res: Response) => {
    if (!req.body.mobile) {
      return responseBuilder.badRequest(res, '', 'ارسال شماره موبایل ضروری است');
    }
    if (!req.body.password) {
      return responseBuilder.badRequest(res, '', 'ارسال رمز عبور ضروری است');
    }
    if (!req.body.activationCode) {
      return responseBuilder.badRequest(res, '', 'ارسال کد فعال سازی ضروری است');
    }
    try {
      const user = await Service.CRUD.findOneRecord('User', { mobile: req.body.mobile, softDelete: false }, []);
      if (!user) {
        return responseBuilder.notFound(res, '', 'کاربری با این شماره موبایل وجود ندارد');
      }
      if (!user.active) {
        return responseBuilder.notFound(res, '', 'کاربر در سیستم غیر فعال شده است لطفا با پشتیبانی تماس بگیرید');
      }
      if (user.activationCode != req.body.activationCode) {
        return responseBuilder.badRequest(res, '', 'کد بازیابی رمز عبور اشتباه است');
      }
      await Service.CRUD.updateById(
        'User',
        { password: CRYPTOGRAPHY.md5(req.body.password), activationCode: '' },
        user._id,
        [],
        ''
      );
      await functions.recordActivity(user._id, '/auth/adminResetPassword', req.body);
      return responseBuilder.success(res, '', 'رمز عبور با موفقیت ویرایش گردید');
    } catch (err) {
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      console.log(chalk.red(err));
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      return responseBuilder.internalErr(res);
    }
  },

  //send activationCode
  sendActivationCode: async (req: Request, res: Response) => {
    if (!req.body.mobile) {
      return responseBuilder.badRequest(res, '', 'ارسال شماره موبایل ضروری است');
    }
    try {
      const user = await Service.CRUD.findOneRecord(
        'User',
        { mobile: req.body.mobile, role: 'admin', softDelete: false },
        []
      );
      if (user) {
        if (!user.active) {
          return responseBuilder.notFound(res, '', 'کاربر در سیستم غیر فعال شده است لطفا با پشتیبانی تماس بگیرید');
        }
        await Service.CRUD.updateById(
          'User',
          { activationCode: Math.floor(Math.random() * 89999 + 10000) },
          user._id,
          [],
          ''
        );
        await functions.recordActivity(user._id, '/auth/adminResetPasswordActivationCode', req.body);
        // let smsPromise = await smsAuth('taleghan', req.body.mobile, activationCode)
        return responseBuilder.success(res, '', ' کد بازیابی برای شما از طریق پیامک ارسال گردید.');
      } else {
        return responseBuilder.notFound(res, '', 'کاربر فعالی با این شماره موبایل وجود ندارد');
      }
    } catch (err) {
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      console.log(chalk.red(err));
      console.log(chalk.underline.red('✖ err from catch of controller : '));
      return responseBuilder.internalErr(res);
    }
  },
};
