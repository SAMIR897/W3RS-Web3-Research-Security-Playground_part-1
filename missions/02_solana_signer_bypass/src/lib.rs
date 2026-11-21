use anchor_lang::prelude::*;

declare_id!("Vault11111111111111111111111111111111111111");

/// w3rs Security Lab - Mission 02: The Unchecked Signer
///
/// VULNERABILITY EXPLANATION:
/// In Solana, anyone can pass any public key as an account into an instruction.
/// To ensure an action is authorized, the program MUST verify that the authority
/// actually SIGNED the transaction (using `Signer<'info>` or checking `account.is_signer`).
///
/// In `WithdrawFunds`, `authority` is declared as an unchecked `AccountInfo` without
/// requiring a cryptographic signature! An attacker can pass the real authority's pubkey
/// without their private key and drain the vault!

#[program]
pub mod solana_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, authority: Pubkey) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = authority;
        vault.total_locked = 0;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.total_locked += amount;
        Ok(())
    }

    // VULNERABLE FUNCTION:
    // Does NOT verify that `ctx.accounts.authority.is_signer == true`!
    pub fn withdraw(ctx: Context<WithdrawFunds>, amount: u64) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        
        // Logical check: matches vault authority... BUT NEVER CHECKED IF SIGNED!
        require_keys_eq!(
            vault.authority, 
            ctx.accounts.authority.key(), 
            VaultError::Unauthorized
        );

        // Funds are transferred to recipient without authority's signature!
        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.recipient.to_account_info().try_borrow_mut_lamports()? += amount;
        vault.total_locked -= amount;

        msg!("Withdrawn {} lamports to {}", amount, ctx.accounts.recipient.key());
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = user, space = 8 + 32 + 8)]
    pub vault: Account<'info, VaultState>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub vault: Account<'info, VaultState>,
    #[account(mut)]
    pub depositor: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(mut)]
    pub vault: Account<'info, VaultState>,

    /// CHECK: VULNERABILITY! Declared as AccountInfo instead of Signer<'info>!
    /// No signature check is performed!
    pub authority: AccountInfo<'info>,

    /// CHECK: Recipient receiving the drained funds
    #[account(mut)]
    pub recipient: AccountInfo<'info>,
}

#[account]
pub struct VaultState {
    pub authority: Pubkey,
    pub total_locked: u64,
}

#[error_code]
pub enum VaultError {
    #[msg("You are not the vault authority.")]
    Unauthorized,
}
