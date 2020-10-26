namespace IntegrationV2.MailboxDomain.Interfaces
{
	using System.Collections.Generic;
	using IntegrationApi.MailboxDomain.Model;

	#region Interface: IMailboxRepository

	/// <summary>
	/// Mailbox storage repository interface.
	/// </summary>
	internal interface IMailboxRepository
	{

		#region Methods: Internal

		/// <summary>
		/// Returns all mailboxes list.
		/// </summary>
		/// <param name="userMailboxesOnly">Select current user mailboxes only flag.</param>
		/// <param name="useForSynchronization">Sign is synchronization mode or not.</param>
		/// <returns><see cref="Mailbox"/> collection.</returns>
		IEnumerable<Mailbox> GetAll(bool userMailboxesOnly = true, bool useForSynchronization = true);

		#endregion

	}

	#endregion

}
