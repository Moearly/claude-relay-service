const nodemailer = require('nodemailer');
const EmailSettings = require('../models/EmailSettings');
const EmailLog = require('../models/EmailLog');
const EmailTemplate = require('../models/EmailTemplate');
const marked = require('marked');

class EmailService {
  constructor() {
    this.transporter = null;
    this.settings = null;
  }

  /**
   * 初始化邮件服务
   */
  async initialize() {
    try {
      this.settings = await EmailSettings.getSettings();
      
      if (!this.settings.enabled) {
        console.log('📧 Email service is disabled');
        return false;
      }

      if (this.settings.provider === 'resend') {
        this.initializeResend();
      } else if (this.settings.provider === 'smtp') {
        this.initializeSMTP();
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      return false;
    }
  }

  /**
   * 初始化 Resend
   */
  initializeResend() {
    if (!this.settings.resendApiKey) {
      console.error('❌ Resend API Key is not configured');
      throw new Error('Resend API Key 未配置');
    }

    // Resend 使用 SMTP 接口
    this.transporter = nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: this.settings.resendApiKey,
      },
    });

    console.log('✅ Resend email service initialized');
    console.log('📧 Resend API Key:', this.settings.resendApiKey ? `${this.settings.resendApiKey.substring(0, 6)}...` : 'not set');
  }

  /**
   * 初始化自定义 SMTP
   */
  initializeSMTP() {
    if (!this.settings.smtpHost || !this.settings.smtpUser) {
      console.error('❌ SMTP configuration is incomplete');
      throw new Error('SMTP 配置不完整');
    }

    this.transporter = nodemailer.createTransport({
      host: this.settings.smtpHost,
      port: this.settings.smtpPort,
      secure: this.settings.smtpSecure,
      auth: {
        user: this.settings.smtpUser,
        pass: this.settings.smtpPassword,
      },
    });

    console.log('✅ SMTP email service initialized');
    console.log('📧 SMTP Host:', this.settings.smtpHost);
  }

  /**
   * 渲染模板变量
   */
  renderTemplate(content, variables = {}) {
    let rendered = content;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      rendered = rendered.replace(regex, value || '');
    }
    return rendered;
  }

  /**
   * 发送邮件（带日志记录）
   */
  async sendEmail({ to, subject, html, text, type = 'custom', templateId = null, templateName = '', sentBy = 'system', metadata = {} }) {
    // 创建日志记录
    const emailLog = new EmailLog({
      to,
      subject,
      type,
      templateId,
      templateName,
      status: 'pending',
      provider: this.settings?.provider || 'resend',
      from: {
        name: this.settings?.fromName || '',
        email: this.settings?.fromEmail || ''
      },
      sentBy,
      metadata
    });

    try {
      // 重新加载设置以确保使用最新配置
      await this.reloadSettings();

      if (!this.settings || !this.settings.enabled) {
        throw new Error('邮件服务未启用，请先在系统设置中启用邮件服务');
      }

      if (!this.transporter) {
        throw new Error('邮件传输器未初始化，请检查邮件配置是否正确');
      }

      const mailOptions = {
        from: `"${this.settings.fromName}" <${this.settings.fromEmail}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // 简单的 HTML 转文本
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent:', info.messageId);

      // 更新日志为成功
      emailLog.status = 'sent';
      emailLog.messageId = info.messageId;
      emailLog.sentAt = new Date();
      await emailLog.save();

      // 如果使用了模板，更新模板使用次数
      if (templateId) {
        await EmailTemplate.findByIdAndUpdate(templateId, {
          $inc: { usageCount: 1 },
          lastUsedAt: new Date()
        });
      }

      return { success: true, messageId: info.messageId, logId: emailLog._id };
    } catch (error) {
      console.error('❌ Failed to send email:', error);

      // 更新日志为失败
      emailLog.status = 'failed';
      emailLog.error = error.message;
      await emailLog.save();

      // 提供更友好的错误信息
      if (error.code === 'EAUTH') {
        throw new Error('邮件服务认证失败，请检查 API Key 或 SMTP 用户名密码是否正确');
      } else if (error.code === 'ECONNECTION') {
        throw new Error('无法连接到邮件服务器，请检查网络连接和服务器配置');
      } else {
        throw new Error(`发送邮件失败：${error.message}`);
      }
    }
  }

  /**
   * 使用模板发送邮件
   */
  async sendEmailWithTemplate({ to, templateSlug, variables = {}, sentBy = 'system', metadata = {} }) {
    // 获取模板
    const template = await EmailTemplate.findOne({ slug: templateSlug, status: 'active' });
    if (!template) {
      throw new Error(`模板 ${templateSlug} 不存在或未激活`);
    }

    // 渲染主题和内容
    const subject = this.renderTemplate(template.subject, variables);
    let content = this.renderTemplate(template.content, variables);

    // 如果是 Markdown，转换为 HTML
    let html = content;
    if (template.contentType === 'markdown') {
      html = marked.parse(content);
    }

    // 发送邮件
    return await this.sendEmail({
      to,
      subject,
      html,
      type: template.type,
      templateId: template._id,
      templateName: template.name,
      sentBy,
      metadata
    });
  }

  /**
   * 发送测试邮件
   */
  async sendTestEmail(to) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 邮件服务测试</h1>
          </div>
          <div class="content">
            <h2>恭喜！邮件服务配置成功</h2>
            <p>您好，</p>
            <p>这是一封来自 <strong>AI Code Relay</strong> 的测试邮件。</p>
            <p>如果您收到这封邮件，说明您的邮件服务已经配置成功，可以正常发送邮件了。</p>
            
            <div style="background: #e8f4fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
              <strong>📋 配置信息：</strong><br>
              提供商：${this.settings.provider === 'resend' ? 'Resend' : '自定义 SMTP'}<br>
              发件人：${this.settings.fromName} &lt;${this.settings.fromEmail}&gt;<br>
              测试时间：${new Date().toLocaleString('zh-CN')}
            </div>

            <p>接下来，您可以：</p>
            <ul>
              <li>配置用户注册邮件通知</li>
              <li>配置密码重置邮件</li>
              <li>配置订单确认邮件</li>
              <li>配置系统通知邮件</li>
            </ul>

            <center>
              <a href="https://codewith.cc" class="button">访问控制台</a>
            </center>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} AI Code Relay. All rights reserved.</p>
            <p>这是一封自动发送的测试邮件，请勿回复。</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to,
      subject: '✅ AI Code Relay - 邮件服务测试',
      html,
      type: 'test',
      sentBy: 'admin'
    });
  }

  /**
   * 发送欢迎邮件
   */
  async sendWelcomeEmail(to, username) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 欢迎加入 AI Code Relay</h1>
          </div>
          <div class="content">
            <h2>您好，${username}！</h2>
            <p>感谢您注册 AI Code Relay 服务。</p>
            <p>我们致力于为您提供最优质的 AI 编程服务体验。</p>
            <p>如有任何问题，请随时联系我们的客服团队。</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} AI Code Relay. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to,
      subject: '欢迎加入 AI Code Relay',
      html,
      type: 'welcome',
      sentBy: 'system'
    });
  }

  /**
   * 重新加载设置
   */
  async reloadSettings() {
    this.transporter = null;
    this.settings = null;
    try {
      await this.initialize();
    } catch (error) {
      console.error('❌ Failed to reload email settings:', error);
      // 不抛出错误，让调用方处理
    }
  }
}

// 导出单例
const emailService = new EmailService();
module.exports = emailService;

