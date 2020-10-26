namespace IntegrationV2.MailboxDomain.Interfaces
{
	using System.Collections.Generic;
	using IntegrationApi.MailboxDomain.Model;

	#region Interface: IMailboxFolderRepository

	/// <summary>
	/// Mailbox folders storage repository interface.
	/// </summary>
	internal interface IMailboxFolderRepository
	{

		#region Methods: Internal

		/// <summary>
		/// Returns all mailboxes folders list.
		/// </summary>
		/// <returns><see cref="MailboxFolder"/> collection.</returns>
		IEnumerable<MailboxFolder> GetAll();

		#endregion

	}

	#endregion

}
